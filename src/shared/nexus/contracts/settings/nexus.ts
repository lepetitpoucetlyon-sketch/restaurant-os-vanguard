/**
 * NEXUS AI CONFIGURATION TYPES
 * Defines the identity, behavior, and automation shortcuts for the restaurant's AI.
 */

export type GeminiVoiceId = 'aoede' | 'fenrir' | 'puck' | 'charon' | 'kore';

export interface NexusMacro {
    [key: string]: import('@shared/nexus-contract').SovereignField | undefined;
    id: string;
    trigger: string;      // The phrase used to trigger the macro
    instruction: string;  // The complex operation described to the AI
    isActive: boolean;
}

export interface NexusConfig {
    [key: string]: import('@shared/nexus-contract').SovereignField | undefined;
    aiName: string;       // Custom name for the assistant (e.g., Albert, Étienne)
    voiceId: GeminiVoiceId; // Selected voice
    personality: 'expert' | 'concise' | 'friendly' | 'protective';
    macros: NexusMacro[];
    historyEnabled: boolean;
    autoLanguage: boolean;
}

export type NexusAIConfig = NexusConfig;

export const GEMINI_VOICES: { id: GeminiVoiceId, name: string, gender: 'female' | 'male', description: string }[] = [
    { id: 'aoede', name: 'Aoede', gender: 'female', description: 'Voix claire, calme et experte.' },
    { id: 'kore', name: 'Kore', gender: 'female', description: 'Voix dynamique et engageante.' },
    { id: 'fenrir', name: 'Fenrir', gender: 'male', description: 'Voix grave, posée et autoritaire.' },
    { id: 'puck', name: 'Puck', gender: 'male', description: 'Voix vive et rapide.' },
    { id: 'charon', name: 'Charon', gender: 'male', description: 'Voix profonde et solennelle.' },
];
