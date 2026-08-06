import type { ILLMProvider, LLMTextRequest, LLMTextResponse, LLMVisionRequest } from './types';
import { logger } from '@/lib/logger';

const API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const BASE_URL = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';

export const ANTHROPIC_MODELS = {
    fast: 'claude-haiku-4-5-20251001',
    reasoning: 'claude-sonnet-4-6',
    visionFast: 'claude-haiku-4-5-20251001',
    visionPro: 'claude-sonnet-4-6',
} as const;

export class AnthropicProvider implements ILLMProvider {
    async generateText(request: LLMTextRequest): Promise<LLMTextResponse> {
        const messages = this.buildMessages(request.history, request.userPrompt);
        return this.call(request, messages);
    }

    async generateFromImage(request: LLMVisionRequest): Promise<LLMTextResponse> {
        const messages = [{
            role: 'user' as const,
            content: [
                {
                    type: 'image' as const,
                    source: {
                        type: 'base64' as const,
                        media_type: request.image.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                        data: request.image.base64,
                    },
                },
                { type: 'text' as const, text: request.userPrompt },
            ],
        }];

        return this.callMessages(
            request.model || ANTHROPIC_MODELS.visionFast,
            messages,
            request.systemPrompt,
            request.maxTokens,
            request.temperature,
        );
    }

    private buildMessages(
        history: Array<{ role: string; content: string }> | undefined,
        userPrompt: string,
    ) {
        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        if (history) {
            for (const msg of history) {
                messages.push({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                });
            }
        }
        messages.push({ role: 'user', content: userPrompt });
        return messages;
    }

    private async call(
        request: LLMTextRequest,
        messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    ): Promise<LLMTextResponse> {
        return this.callMessages(
            request.model || ANTHROPIC_MODELS.fast,
            messages,
            request.systemPrompt,
            request.maxTokens,
            request.temperature,
        );
    }

    private async callMessages(
        model: string,
        messages: unknown[],
        systemPrompt?: string,
        maxTokens?: number,
        temperature?: number,
    ): Promise<LLMTextResponse> {
        if (!API_KEY) throw new Error('[AnthropicProvider] ANTHROPIC_API_KEY not set');

        logger.debug(`[AnthropicProvider] calling model=${model}`);

        const body: Record<string, unknown> = {
            model,
            max_tokens: maxTokens ?? 2048,
            messages,
        };
        if (systemPrompt) body.system = systemPrompt;
        if (temperature !== undefined) body.temperature = temperature;

        const res = await fetch(`${BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': API_VERSION,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(30_000),
        });

        if (!res.ok) {
            const err = await res.text();
            logger.error(`[AnthropicProvider] ${res.status}`, err);
            throw new Error(`Anthropic API error ${res.status}: ${err}`);
        }

        const data = await res.json() as {
            content?: Array<{ type: string; text?: string }>;
            usage?: { input_tokens?: number; output_tokens?: number };
        };

        const text = data.content?.find(c => c.type === 'text')?.text ?? '';
        return {
            text,
            usage: data.usage ? {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
            } : undefined,
        };
    }
}
