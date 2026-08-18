import type { ILLMProvider, LLMTextRequest, LLMTextResponse, LLMVisionRequest } from './types';
import { logger } from '@/lib/logger';

const DEFAULT_BASE_URL = 'https://api.mistral.ai/v1';

export const MISTRAL_MODELS = {
    fast: 'mistral-small-latest',
    reasoning: 'mistral-large-latest',
    visionFast: 'pixtral-12b-2409',
    visionPro: 'pixtral-large-latest',
} as const;

export class MistralProvider implements ILLMProvider {
    private readonly customApiKey?: string;
    private readonly customBaseUrl?: string;

    constructor(apiKey?: string, baseUrl?: string) {
        this.customApiKey = apiKey;
        this.customBaseUrl = baseUrl;
    }

    private getApiKey(): string {
        return this.customApiKey ?? process.env.MISTRAL_API_KEY ?? '';
    }

    private getBaseUrl(): string {
        return this.customBaseUrl ?? process.env.MISTRAL_BASE_URL ?? DEFAULT_BASE_URL;
    }

    async generateText(request: LLMTextRequest): Promise<LLMTextResponse> {
        const messages = this.buildMessages(request.systemPrompt, request.history, request.userPrompt);
        return this.call(request.model || MISTRAL_MODELS.fast, messages, request.maxTokens, request.temperature);
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
        return this.call(request.model || MISTRAL_MODELS.visionFast, messages, request.maxTokens, request.temperature);
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
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error('[MistralProvider] MISTRAL_API_KEY not set');

        logger.debug(`[MistralProvider] calling model=${model}`);

        const res = await fetch(`${this.getBaseUrl()}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
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
            logger.error(`[MistralProvider] ${res.status}`, err);
            throw new Error(`Mistral API error ${res.status}: ${err}`);
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
