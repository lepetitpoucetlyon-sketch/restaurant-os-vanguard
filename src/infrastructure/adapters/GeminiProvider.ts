import type { ILLMProvider, LLMTextRequest, LLMTextResponse, LLMVisionRequest } from '@/modules/intelligence/ai';
import { logger } from '@/lib/logger';

const API_KEY = process.env.GEMINI_API_KEY || '';
const BASE_URL = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

let errorCount = 0;
let circuitBreakerUntil = 0;

interface GeminiPart {
    text?: string;
    inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
    role: string;
    parts: GeminiPart[];
}

interface GeminiResponse {
    candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
    };
    error?: { message?: string; code?: number };
}

export class GeminiProvider implements ILLMProvider {

    async generateText(request: LLMTextRequest): Promise<LLMTextResponse> {
        this.checkCircuitBreaker();
        const contents = this.buildContents(request.history, request.userPrompt);
        const body = this.buildRequestBody(contents, request);

        try {
            const res = await this.call(request.model, body);
            this.resetCircuitBreaker();
            return res;
        } catch (err) {
            this.tripCircuitBreaker();
            throw err;
        }
    }

    async generateFromImage(request: LLMVisionRequest): Promise<LLMTextResponse> {
        this.checkCircuitBreaker();
        const userParts: GeminiPart[] = [
            { text: request.userPrompt },
            { inlineData: { mimeType: request.image.mimeType, data: request.image.base64 } },
        ];
        const contents: GeminiContent[] = [{ role: 'user', parts: userParts }];
        const body = this.buildRequestBody(contents, request);

        try {
            const res = await this.call(request.model, body);
            this.resetCircuitBreaker();
            return res;
        } catch (err) {
            this.tripCircuitBreaker();
            throw err;
        }
    }

    // ── internals ────────────────────────────────────────────

    private checkCircuitBreaker() {
        if (Date.now() < circuitBreakerUntil) {
            throw new Error('Gemini API circuit breaker open (paused for 60s)');
        }
    }

    private tripCircuitBreaker() {
        errorCount++;
        if (errorCount >= 3) {
            circuitBreakerUntil = Date.now() + 60000;
            logger.warn(`[GeminiProvider] Circuit breaker tripped! Pausing for 60s`);
        }
    }

    private resetCircuitBreaker() {
        if (errorCount > 0) {
            errorCount = 0;
            logger.info(`[GeminiProvider] Circuit breaker reset.`);
        }
    }

    private buildContents(
        history: Array<{ role: string; content: string }> | undefined,
        userPrompt: string,
    ): GeminiContent[] {
        const contents: GeminiContent[] = [];

        if (history) {
            for (const msg of history) {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                });
            }
        }

        contents.push({ role: 'user', parts: [{ text: userPrompt }] });
        return contents;
    }

    private buildRequestBody(
        contents: GeminiContent[],
        request: Pick<LLMTextRequest, 'systemPrompt' | 'temperature' | 'maxTokens' | 'responseMimeType'>,
    ): Record<string, unknown> {
        const body: Record<string, unknown> = { contents };

        if (request.systemPrompt) {
            body.systemInstruction = { parts: [{ text: request.systemPrompt }] };
        }

        const generationConfig: Record<string, unknown> = {};
        if (request.temperature !== undefined) generationConfig.temperature = request.temperature;
        if (request.maxTokens !== undefined) generationConfig.maxOutputTokens = request.maxTokens;
        if (request.responseMimeType) generationConfig.responseMimeType = request.responseMimeType;

        if (Object.keys(generationConfig).length > 0) {
            body.generationConfig = generationConfig;
        }

        return body;
    }

    private async call(model: string, body: Record<string, unknown>): Promise<LLMTextResponse> {
        const url = `${BASE_URL}/models/${model}:generateContent?key=${API_KEY}`;

        logger.debug(`[GeminiProvider] POST ${model}:generateContent`);

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorBody = await res.text();
            logger.error(`[GeminiProvider] ${res.status} from Gemini API`, errorBody);
            throw new Error(`Gemini API error ${res.status}: ${errorBody}`);
        }

        const data: GeminiResponse = await res.json();

        if (data.error) {
            throw new Error(`Gemini API error ${data.error.code}: ${data.error.message}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        return {
            text,
            usage: data.usageMetadata
                ? {
                      promptTokens: data.usageMetadata.promptTokenCount,
                      completionTokens: data.usageMetadata.candidatesTokenCount,
                  }
                : undefined,
        };
    }
}
