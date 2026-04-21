import { AccessPolicyManager, CategoryKey } from "@/domain/services/AccessPolicyManager";
import { User } from '@/types';
import { AGENT_TOOLS } from './tools';

export type GeminiLiveEvent = 
    | { type: 'audio', data: Int16Array }
    | { type: 'text', data: string }
    | { type: 'tool_call', name: string, args: Record<string, unknown>, callId: string }
    | { type: 'error', message: string };

/**
 * PRODUCTION-GRADE SERVICE: GeminiLiveService
 * Centralizes multimodal interaction, tool dispatching, and RBAC enforcement.
 */
export class GeminiLiveService {
    private socket: WebSocket | null = null;
    private user: User | null = null;
    private rolePermissions: string[] | null = null;

    private audioContext: AudioContext | null = null;
    private nextStartTime: number = 0;

    private onTranscript: ((text: string, isUser: boolean) => void) | null = null;
    private onToolCall: ((name: string, args: Record<string, unknown>) => void) | null = null;

    constructor(user: User, rolePermissions: string[], callbacks?: { 
        onTranscript?: (text: string, isUser: boolean) => void,
        onToolCall?: (name: string, args: Record<string, unknown>) => void 
    }) {
        this.user = user;
        this.rolePermissions = rolePermissions;
        this.onTranscript = callbacks?.onTranscript || null;
        this.onToolCall = callbacks?.onToolCall || null;
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 16000 });
    }


    async connect(config?: { system_instruction?: string, tools?: Record<string, unknown>[] }) {
        const relayPort = 3001;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect to the specialized relay port
        this.socket = new WebSocket(`${protocol}//${window.location.hostname}:${relayPort}/api/gemini-live/ws`);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onmessage = async (event) => {
            // Handle binary audio data
            if (event.data instanceof ArrayBuffer) {
                this.playAudio(event.data);
                return;
            }

            const data = JSON.parse(event.data);
            
            // Capture Transcriptions (Unified format from bridge)
            if (data.type === 'transcript') {
                this.onTranscript?.(data.text, data.isUser);
            }

            if (data.type === 'tool_call') {
                this.onToolCall?.(data.name, data.args);
                await this.handleToolCall(data);
            }
        };

        this.socket.onopen = () => {
            console.log("Connected to Gemini Live Secure Relay");
            this.socket?.send(JSON.stringify({
                type: 'setup',
                user: { id: this.user?.id, role: this.user?.role, name: this.user?.name },
                config: config // Transmit DNA and Tools to the bridge
            }));
        };
    }

    sendText(text: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
            type: 'text',
            text
        }));
        // Local feedback for the UI
        this.onTranscript?.(text, true);
    }



    private playAudio(buffer: ArrayBuffer) {
        if (!this.audioContext) return;

        const int16Array = new Int16Array(buffer);
        const float32Array = new Float32Array(int16Array.length);
        
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 0x7FFF;
        }

        const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 16000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
        source.start(startTime);
        this.nextStartTime = startTime + audioBuffer.duration;
    }

    stopPlayback() {
        if (!this.audioContext) return;
        // In this implementation, we simply reset the timing. 
        // A more advanced version would also call .stop() on active buffer sources.
        this.nextStartTime = this.audioContext.currentTime;
    }

    private async handleToolCall(event: { name: string, args: Record<string, unknown>, callId: string }) {

        const tool = AGENT_TOOLS[event.name];
        
        if (!tool) {
            this.sendToolResult(event.callId, { error: `Tool ${event.name} not found` });
            return;
        }

        // --- RBAC SENTINEL ---
        const hasAccess = AccessPolicyManager.hasAccess(
            this.user, 
            this.rolePermissions as string[], 
            tool.category as CategoryKey
        );

        if (!hasAccess) {
            console.warn(`RBAC Violation: User ${this.user?.name} (${this.user?.role}) tried to access ${tool.name}`);
            this.sendToolResult(event.callId, { 
                error: "Désolé, vous n'avez pas les droits nécessaires pour effectuer cette action." 
            });
            return;
        }

        try {
            // Injecting Engines/State as context for the tool
            const result = await tool.execute(event.args, this.user!, {
                // Here we can inject real engine instances if we have access to them
                // For now, we provide the metadata needed for strategic analysis
                timestamp: new Date().toISOString()
            });
            this.sendToolResult(event.callId, result);
        } catch (error) {
            console.error(`Tool Execution Error (${tool.name}):`, error);
            this.sendToolResult(event.callId, { error: "Une erreur est survenue lors de l'exécution de la commande." });
        }
    }

    private sendToolResult(callId: string, result: unknown) {
        this.socket?.send(JSON.stringify({
            type: 'tool_result',
            callId,
            result
        }));
    }

    sendAudio(audioData: Int16Array) {
        // Send raw PCM to relay
        this.socket?.send(audioData.buffer);
    }

    disconnect() {
        this.socket?.close();
        this.socket = null;
    }
}
