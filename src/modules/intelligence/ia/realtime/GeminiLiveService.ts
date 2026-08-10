import { AccessPolicyManager, CategoryKey, RolePermissions } from '@/lib/AccessPolicyManager';
import { User } from '@nexus/contracts';
import { AGENT_TOOLS } from '@/modules/intelligence';
import { ToolDefinition } from '@/src/modules/intelligence/domain/agent/tools/types';;
import { SovereignData, SovereignValue } from '@shared/nexus-contract';
import { ShieldedContext } from '@/src/modules/intelligence/ia/ai/ShieldedContext';;
import { logger } from '@/lib/logger';
import type { IRealtimeVoiceService, RealtimeVoiceCallbacks, RealtimeVoiceConfig } from './IRealtimeVoiceService';
import { toError } from "@/lib/toError";

export class GeminiLiveService implements IRealtimeVoiceService {
    private socket: WebSocket | null = null;
    private user: User | null = null;
    private rolePermissions: RolePermissions | null = null;

    private audioContext: AudioContext | null = null;
    private nextStartTime: number = 0;

    private onTranscript: ((text: string, isUser: boolean) => void) | null = null;
    private onToolCall: ((name: string, args: SovereignData) => void) | null = null;

    constructor(user: User, rolePermissions: RolePermissions, callbacks?: RealtimeVoiceCallbacks) {
        this.user = user;
        this.rolePermissions = rolePermissions;
        this.onTranscript = callbacks?.onTranscript ?? null;
        this.onToolCall = callbacks?.onToolCall ?? null;
        const AudioContextClass = (typeof window !== 'undefined')
            ? ((window as unknown as Record<string, unknown>).AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext) as { new(options?: AudioContextOptions): AudioContext }
            : null;
        if (AudioContextClass) {
            this.audioContext = new AudioContextClass({ sampleRate: 16000 });
        }
    }

    async connect(config?: RealtimeVoiceConfig): Promise<void> {
        const relayPort = 3001;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.socket = new WebSocket(`${protocol}//${window.location.hostname}:${relayPort}/api/gemini-live/ws`);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onmessage = async (event) => {
            if (event.data instanceof ArrayBuffer) {
                this.playAudio(event.data);
                return;
            }
            const data = JSON.parse(event.data);
            if (data.type === 'transcript') {
                this.onTranscript?.(data.text, data.isUser);
            }
            if (data.type === 'tool_call') {
                this.onToolCall?.(data.name, data.args);
                await this.handleToolCall(data);
            }
        };

        this.socket.onopen = () => {
            logger.info('Connected to Realtime Voice Secure Relay');
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
                config: { ...config, tools: safeTools },
            }));
        };
    }

    sendText(text: string): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({ type: 'text', text }));
        this.onTranscript?.(text, true);
    }

    sendAudio(audioData: Int16Array): void {
        this.socket?.send(audioData.buffer);
    }

    stopPlayback(): void {
        if (!this.audioContext) return;
        this.nextStartTime = this.audioContext.currentTime;
    }

    disconnect(): void {
        this.socket?.close();
        this.socket = null;
    }

    // ── privés ───────────────────────────────────────────────────────────────

    private playAudio(buffer: ArrayBuffer): void {
        if (!this.audioContext) return;
        const int16Array = new Int16Array(buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 0x7fff;
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

    private async handleToolCall(event: { name: string; args: SovereignData; callId: string }): Promise<void> {
        const tool = AGENT_TOOLS[event.name];
        if (!tool) {
            this.sendToolResult(event.callId, { error: `Tool ${event.name} not found` });
            return;
        }
        const validation = tool.schema.safeParse(event.args);
        if (!validation.success) {
            const errorMessages = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
            logger.warn(`[RealtimeVoice] Validation error on ${tool.name}: ${errorMessages}`);
            this.sendToolResult(event.callId, {
                error: `Arguments invalides pour ${tool.name}. Erreurs: ${errorMessages}. Veuillez corriger et réessayer.`,
            });
            return;
        }
        const hasAccess = AccessPolicyManager.hasAccess(this.user, this.rolePermissions!, tool.category as CategoryKey);
        if (!hasAccess) {
            logger.warn(`[RealtimeVoice] RBAC violation: ${this.user?.name} (${this.user?.role}) → ${tool.name}`);
            this.sendToolResult(event.callId, {
                error: "Désolé, vous n'avez pas les droits nécessaires pour effectuer cette action.",
            });
            return;
        }
        try {
            const tenantId = this.user?.tenantId || 'anonymous-vassal';
            const result = await ShieldedContext.run(tenantId, async () => {
                return await (tool as ToolDefinition).execute(validation.data, this.user!, {
                    timestamp: new Date().toISOString(),
                });
            });
            this.sendToolResult(event.callId, result as SovereignData);
        } catch (error) {
            logger.error(`[RealtimeVoice] Tool execution error (${tool.name})`, { error: toError(error).message });
            this.sendToolResult(event.callId, { error: "Une erreur est survenue lors de l'exécution de la commande." });
        }
    }

    private sendToolResult(callId: string, result: SovereignValue): void {
        this.socket?.send(JSON.stringify({ type: 'tool_result', callId, result }));
    }
}
