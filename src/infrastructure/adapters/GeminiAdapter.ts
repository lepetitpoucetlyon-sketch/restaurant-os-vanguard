import { AccessPolicyManager, CategoryKey, RolePermissions } from "@domain/services/AccessPolicyManager";
import { User } from '@nexus/contracts';
import { AGENT_TOOLS } from '@/modules/intelligence/ia/tools';
import { ToolDefinition } from '@/modules/intelligence/domain/agent/tools/types';
import { SovereignData, SovereignValue } from "@shared/nexus-contract";
import { ShieldedContext } from '@/modules/intelligence/ia/ai/ShieldedContext';
import { logger } from '@/lib/logger';

export type GeminiLiveEvent = 
    | { type: 'audio', data: Int16Array }
    | { type: 'text', data: string }
    | { type: 'tool_call', name: string, args: SovereignData, callId: string }
    | { type: 'error', message: string };

interface _WebkitWindow extends Window {
    webkitAudioContext: typeof AudioContext;
}

/**
 * PRODUCTION-GRADE SERVICE: GeminiLiveService
 * Centralizes multimodal interaction, tool dispatching, and RBAC enforcement.
 */
export class GeminiLiveService {
    private socket: WebSocket | null = null;
    private user: User | null = null;
    private rolePermissions: RolePermissions | null = null;

    private audioContext: AudioContext | null = null;
    private nextStartTime: number = 0;

    private onTranscript: ((text: string, isUser: boolean) => void) | null = null;
    private onToolCall: ((name: string, args: SovereignData) => void) | null = null;

    constructor(user: User, rolePermissions: RolePermissions, callbacks?: { 
        onTranscript?: (text: string, isUser: boolean) => void,
        onToolCall?: (name: string, args: SovereignData) => void 
    }) {
        this.user = user;
        this.rolePermissions = rolePermissions;
        this.onTranscript = callbacks?.onTranscript || null;
        this.onToolCall = callbacks?.onToolCall || null;
        const AudioContextClass = (typeof window !== 'undefined') 
            ? ((window as unknown as Record<string, unknown>).AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext) as { new(options?: AudioContextOptions): AudioContext }
            : null;
        if (AudioContextClass) {
            this.audioContext = new AudioContextClass({ sampleRate: 16000 });
        }
    }


    async connect(config?: { system_instruction?: string, tools?: SovereignData[] }) {
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
            logger.info("Connected to Gemini Live Secure Relay");
            
            // 🛡️ DYNAMIC TOOL MASKING: Declare only permitted tools to the chatbot
            let safeTools = config?.tools;
            if (safeTools && this.user && this.rolePermissions) {
                safeTools = safeTools.filter((t: Record<string, unknown>) => {
                    if (!t.category) return true;
                    return AccessPolicyManager.hasAccess(this.user!, this.rolePermissions!, t.category as string);
                });
            }

            this.socket?.send(JSON.stringify({
                type: 'setup',
                user: { id: this.user?.id, role: this.user?.role, name: this.user?.name },
                config: { ...config, tools: safeTools } // Transmit only safe tools to the bridge
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

    private async handleToolCall(event: { name: string, args: SovereignData, callId: string }) {
        const tool = AGENT_TOOLS[event.name];
        
        if (!tool) {
            this.sendToolResult(event.callId, { error: `Tool ${event.name} not found` });
            return;
        }

        // --- 🛡️ ZOD ANTI-HALLUCINATION FILTER ---
        const validation = tool.schema.safeParse(event.args);
        if (!validation.success) {
            const errorMessages = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
            console.warn(`[GeminiLive] Hallucination/Validation Error on ${tool.name}: ${errorMessages}`);
            
            // FEEDBACK LOOP: Send error to Gemini so it can self-correct
            this.sendToolResult(event.callId, { 
                error: `Arguments invalides pour ${tool.name}. Erreurs: ${errorMessages}. Veuillez corriger et réessayer.` 
            });
            return;
        }

        const validatedArgs = validation.data;

        // --- RBAC SENTINEL ---
        const hasAccess = AccessPolicyManager.hasAccess(
            this.user, 
            this.rolePermissions!, 
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
            // 🛡️ SHIELDED SANDBOX EXECUTION: Prevent cross-tenant data leakages
            const tenantId = this.user?.tenantId || 'anonymous-vassal';
            const result = await ShieldedContext.run(tenantId, async () => {
                return await (tool as ToolDefinition).execute(validatedArgs, this.user!, {
                    timestamp: new Date().toISOString()
                });
            });
            this.sendToolResult(event.callId, result as SovereignData);
        } catch (error) {
            console.error(`Tool Execution Error (${tool.name}):`, error);
            this.sendToolResult(event.callId, { error: "Une erreur est survenue lors de l'exécution de la commande." });
        }
    }

    private sendToolResult(callId: string, result: SovereignValue) {
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
