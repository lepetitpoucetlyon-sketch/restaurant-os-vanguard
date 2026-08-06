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

// Model aliases sémantiques — chaque provider les mappe vers ses propres identifiants
export type LLMModelAlias = 'fast' | 'reasoning' | 'vision-fast' | 'vision-pro';
