// GeminiAdapter.ts — backward-compat re-export
// L'implémentation réelle vit dans realtime/GeminiLiveService.ts
export { GeminiLiveService } from './realtime/GeminiLiveService';
export type { IRealtimeVoiceService, RealtimeVoiceConfig, RealtimeVoiceCallbacks } from './realtime/IRealtimeVoiceService';

import type { SovereignData } from '@shared/nexus-contract';

export type GeminiLiveEvent =
    | { type: 'audio'; data: Int16Array }
    | { type: 'text'; data: string }
    | { type: 'tool_call'; name: string; args: SovereignData; callId: string }
    | { type: 'error'; message: string };
