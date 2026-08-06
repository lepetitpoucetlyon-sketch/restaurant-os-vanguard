import type { ILLMProvider, LLMTextRequest, LLMTextResponse, LLMVisionRequest } from './types';
import { logger } from '@/lib/logger';

const API_KEY = process.env.OPENAI_API_KEY ?? '';
const BASE_URL = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

export const OPENAI_MODELS = {
    fast: 'gpt-4o-mini',
    reasoning: 'gpt-4o',
    visionFast: 'gpt-4o-mini',
    visionPro: 'gpt-4o',
} as const;

export class OpenAIProvider implements ILLMProvider {
    async generateText(request: LLMTextRequest): Promise<LLMTextResponse> {
        const messages = this.buildMessages(request.systemPrompt, request.history, request.userPrompt);
        return this.call(request.model || OPENAI_MODELS.fast, messages, request.maxTokens, request.temperature);
    }

    async generateFromImage(request: LLMVisionRequest): Promise<LLMTextResponse> {
        const messages: unknown[] = [];
        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }
        messages.push({
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: { url: `data:${request.image.mimeType};base64,${request.image.base64}` },
                },
                { type: 'text', text: request.userPrompt },
            ],
        });
        return this.call(request.model || OPENAI_MODELS.visionFast, messages, request.maxTokens, request.temperature);
    }

    private buildMessages(
        systemPrompt: string | undefined,
        history: Array<{ role: string; content: string }> | undefined,
        userPrompt: string,
    ) {
        const messages: Array<{ role: string; content: string }> = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        if (history) {
            for (const msg of history) messages.push({ role: msg.role, content: msg.content });
        }
        messages.push({ role: 'user', content: userPrompt });
        return messages;
    }

    private async call(
        model: string,
        messages: unknown[],
        maxTokens?: number,
        temperature?: number,
    ): Promise<LLMTextResponse> {
        if (!API_KEY) throw new Error('[OpenAIProvider] OPENAI_API_KEY not set');

        logger.debug(`[OpenAIProvider] calling model=${model}`);

        const res = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens ?? 2048,
                temperature: temperature ?? 0.2,
            }),
            signal: AbortSignal.timeout(30_000),
        });

        if (!res.ok) {
            const err = await res.text();
            logger.error(`[OpenAIProvider] ${res.status}`, err);
            throw new Error(`OpenAI API error ${res.status}: ${err}`);
        }

        const data = await res.json() as {
            choices?: Array<{ message?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
        };

        const text = data.choices?.[0]?.message?.content ?? '';
        return {
            text,
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
            } : undefined,
        };
    }
}
