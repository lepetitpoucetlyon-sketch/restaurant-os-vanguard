export interface ILLMProvider {
    generateText(request: LLMTextRequest): Promise<LLMTextResponse>;
    generateFromImage(request: LLMVisionRequest): Promise<LLMTextResponse>;
}

export interface LLMTextRequest {
    model: string;
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    responseMimeType?: string;
    history?: Array<{ role: string; content: string }>;
}

export interface LLMVisionRequest {
    model: string;
    systemPrompt?: string;
    userPrompt: string;
    image: { base64: string; mimeType: string };
    temperature?: number;
    maxTokens?: number;
    responseMimeType?: string;
}

export interface LLMTextResponse {
    text: string;
    usage?: { promptTokens?: number; completionTokens?: number };
}

export const AI_MODELS = {
    fast: 'gemini-1.5-flash',
    reasoning: 'gemini-1.5-pro',
    visionFast: 'gemini-2.0-flash',
    visionPro: 'gemini-2.0-pro',
} as const;

export type AIModelId = typeof AI_MODELS[keyof typeof AI_MODELS];
