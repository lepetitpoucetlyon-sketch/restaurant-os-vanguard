import type { ILLMProvider, LLMTextRequest, LLMTextResponse, LLMVisionRequest } from './types';
import { logger } from '@/lib/logger';
import { redactPII } from '@/lib/security/redactPII';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000/v1';
const DEFAULT_API_KEY = 'sovereign-internal-token';

export const SOVEREIGN_MODELS = {
    fast: 'restaurant-os-slm-v1',
    reasoning: 'restaurant-os-slm-v1',
    visionFast: 'restaurant-os-slm-v1',
    visionPro: 'restaurant-os-slm-v1',
} as const;

export class SovereignProvider implements ILLMProvider {
    private readonly customBaseUrl?: string;
    private readonly customApiKey?: string;

    constructor(baseUrl?: string, apiKey?: string) {
        this.customBaseUrl = baseUrl ? baseUrl.replace(/\/$/, '') : undefined;
        this.customApiKey = apiKey;
    }

    private getBaseUrl(): string {
        return this.customBaseUrl ?? process.env.SOVEREIGN_SLM_URL ?? process.env.VLLM_BASE_URL ?? DEFAULT_BASE_URL;
    }

    private getApiKey(): string {
        return this.customApiKey ?? process.env.SOVEREIGN_SLM_API_KEY ?? DEFAULT_API_KEY;
    }

    async generateText(request: LLMTextRequest): Promise<LLMTextResponse> {
        const sanitizedPrompt = redactPII(request.userPrompt);
        const sanitizedSystem = request.systemPrompt ? redactPII(request.systemPrompt) : undefined;

        const messages: Array<{ role: string; content: string }> = [];
        if (sanitizedSystem) {
            messages.push({ role: 'system', content: sanitizedSystem });
        }
        if (request.history) {
            for (const msg of request.history) {
                messages.push({ role: msg.role, content: redactPII(msg.content) });
            }
        }
        messages.push({ role: 'user', content: sanitizedPrompt });

        const model = request.model || SOVEREIGN_MODELS.fast;
        return this.callChat(model, messages, request.maxTokens, request.temperature);
    }

    async generateFromImage(request: LLMVisionRequest): Promise<LLMTextResponse> {
        const sanitizedPrompt = redactPII(request.userPrompt);
        const messages: unknown[] = [];
        if (request.systemPrompt) {
            messages.push({ role: 'system', content: redactPII(request.systemPrompt) });
        }
        messages.push({
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: { url: `data:${request.image.mimeType};base64,${request.image.base64}` },
                },
                { type: 'text', text: sanitizedPrompt },
            ],
        });

        const model = request.model || SOVEREIGN_MODELS.visionFast;
        return this.callChat(model, messages, request.maxTokens, request.temperature);
    }

    private async callChat(
        model: string,
        messages: unknown[],
        maxTokens?: number,
        temperature?: number,
    ): Promise<LLMTextResponse> {
        const baseUrl = this.getBaseUrl();
        const apiKey = this.getApiKey();
        logger.debug(`[SovereignProvider] calling model=${model} on endpoint=${baseUrl}`);

        const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens ?? 2048,
                temperature: temperature ?? 0.1,
            }),
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
            const err = await res.text();
            logger.error(`[SovereignProvider] Error HTTP ${res.status}:`, err);
            throw new Error(`Sovereign SLM error ${res.status}: ${err}`);
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
