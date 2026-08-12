import type { SovereignData } from '@nexus/contracts/nexus-contract';

export interface RealtimeVoiceCallbacks {
    onTranscript?: (text: string, isUser: boolean) => void;
    onToolCall?: (name: string, args: SovereignData) => void;
}

export interface RealtimeVoiceConfig {
    system_instruction?: string;
    tools?: SovereignData[];
}

export interface IRealtimeVoiceService {
    connect(config?: RealtimeVoiceConfig): Promise<void>;
    disconnect(): void;
    sendAudio(pcm: Int16Array): void;
    sendText(text: string): void;
    stopPlayback(): void;
}
