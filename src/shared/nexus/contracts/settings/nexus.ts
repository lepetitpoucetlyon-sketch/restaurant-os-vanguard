/**
 * NEXUS AI CONFIGURATION TYPES
 * Defines the identity, behavior, and automation shortcuts for the restaurant's AI.
 */

export type GeminiVoiceId = 'aoede' | 'fenrir' | 'puck' | 'charon' | 'kore';

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'local';

export interface AIProviderModel {
    id: string;
    label: string;
    tier: 'fast' | 'balanced' | 'powerful';
}

export const AI_PROVIDER_MODELS: Record<AIProvider, AIProviderModel[]> = {
    gemini: [
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', tier: 'fast' },
        { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', tier: 'fast' },
        { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', tier: 'balanced' },
        { id: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro', tier: 'powerful' },
    ],
    openai: [
        { id: 'gpt-4o-mini', label: 'GPT-4o Mini', tier: 'fast' },
        { id: 'gpt-4o', label: 'GPT-4o', tier: 'balanced' },
        { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', tier: 'powerful' },
    ],
    anthropic: [
        { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', tier: 'fast' },
        { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', tier: 'balanced' },
        { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', tier: 'powerful' },
    ],
    local: [
        { id: 'llama3', label: 'Llama 3', tier: 'balanced' },
        { id: 'mistral', label: 'Mistral', tier: 'balanced' },
        { id: 'phi3', label: 'Phi-3', tier: 'fast' },
    ],
};

export interface NexusMacro {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    id: string;
    trigger: string;
    instruction: string;
    isActive: boolean;
}

export interface NexusConfig {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    aiName: string;
    voiceId: GeminiVoiceId;
    personality: 'expert' | 'concise' | 'friendly' | 'protective';
    macros: NexusMacro[];
    historyEnabled: boolean;
    autoLanguage: boolean;
    aiProvider?: AIProvider;
    aiModel?: string;
    aiApiKey?: string;
    aiEndpoint?: string; // for local/self-hosted models
}

export type NexusAIConfig = NexusConfig;

export const GEMINI_VOICES: { id: GeminiVoiceId, name: string, gender: 'female' | 'male', description: string }[] = [
    { id: 'aoede', name: 'Aoede', gender: 'female', description: 'Voix claire, calme et experte.' },
    { id: 'kore', name: 'Kore', gender: 'female', description: 'Voix dynamique et engageante.' },
    { id: 'fenrir', name: 'Fenrir', gender: 'male', description: 'Voix grave, posée et autoritaire.' },
    { id: 'puck', name: 'Puck', gender: 'male', description: 'Voix vive et rapide.' },
    { id: 'charon', name: 'Charon', gender: 'male', description: 'Voix profonde et solennelle.' },
];
