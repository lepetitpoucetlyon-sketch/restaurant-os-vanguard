import { User } from '@nexus/contracts';
import { RolePermissions } from '@/lib/AccessPolicyManager';
import type { IRealtimeVoiceService, RealtimeVoiceCallbacks } from './IRealtimeVoiceService';
import { GeminiLiveService } from './GeminiLiveService';

type RealtimeProvider = 'gemini'; // | 'openai' | 'cartesia' — ajouter ici + case ci-dessous

function resolveProvider(): RealtimeProvider {
    const env = process.env.NEXT_PUBLIC_REALTIME_PROVIDER as RealtimeProvider | undefined;
    return env ?? 'gemini';
}

export const RealtimeVoiceFactory = {
    create(
        user: User,
        rolePermissions: RolePermissions,
        callbacks?: RealtimeVoiceCallbacks,
    ): IRealtimeVoiceService {
        switch (resolveProvider()) {
            case 'gemini':
                return new GeminiLiveService(user, rolePermissions, callbacks);
            default:
                return new GeminiLiveService(user, rolePermissions, callbacks);
        }
    },
};
