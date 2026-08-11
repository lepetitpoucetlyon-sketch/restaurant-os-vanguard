import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSafeAction } from '@/lib/server/actionWrapper';
import * as verifySessionModule from '@/lib/server/verifySession';
import { NexusError, NexusErrorCode } from '@/shared/nexus/errors';
import { PinHashService } from '@/lib/server/PinHashService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { z } from 'zod';

// Removed PinHashService mock

vi.mock('@/shared/rbac/actionPermissionMap', () => ({
    ACTION_MAP: {
        pos: {
            send_to_kitchen: { minLevel: 10, requiresPin: false },
            void_ticket: { minLevel: 20, requiresPin: true },
        }
    }
}));

describe('createSafeAction (actionWrapper)', () => {
    let mockRequireSession: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRequireSession = vi.spyOn(verifySessionModule, 'requireSession');
    });

    it('doit échouer si la session est invalide', async () => {
        const handler = vi.fn();
        const action = createSafeAction(z.tuple([z.string()]), { page: 'pos', action: 'send_to_kitchen' }, handler);
        
        mockRequireSession.mockRejectedValue(new NexusError(NexusErrorCode.ACCESS_DENIED, 'Session invalide ou expirée'));
        
        await expect(action('tenant-1', 'test')).rejects.toThrow('Session invalide ou expirée');
        expect(handler).not.toHaveBeenCalled();
    });

    it('doit échouer si le rôle n\'a pas la permission', async () => {
        const handler = vi.fn();
        const action = createSafeAction(z.tuple([z.string()]), { page: 'pos', action: 'send_to_kitchen' }, handler);
        
        // plongeur a un niveau 10, send_to_kitchen nécessite 10, mais void_ticket nécessite 40
        const actionVoid = createSafeAction(z.tuple([z.string()]), { page: 'pos', action: 'void_ticket' }, handler);
        
        mockRequireSession.mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-1', role: 'plongeur' } as any);
        
        await expect(actionVoid('tenant-1', 'test')).rejects.toThrow('Droits insuffisants');
        expect(handler).not.toHaveBeenCalled();
    });

    it('doit échouer si le payload Zod est invalide', async () => {
        const handler = vi.fn();
        const action = createSafeAction(z.tuple([z.number()]), { page: 'pos', action: 'send_to_kitchen' }, handler);
        
        mockRequireSession.mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-1', role: 'manager' } as any);
        
        await expect(action('tenant-1', 'not-a-number' as any)).rejects.toThrow(NexusError);
        expect(handler).not.toHaveBeenCalled();
    });

    it('doit exécuter le handler si tout est valide et sans PIN requis', async () => {
        const handler = vi.fn().mockResolvedValue({ success: true });
        const action = createSafeAction(z.tuple([z.string()]), { page: 'pos', action: 'send_to_kitchen' }, handler);
        
        mockRequireSession.mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-1', role: 'manager' } as any);
        
        const result = await action('tenant-1', 'hello');
        expect(result).toEqual({ success: true });
        expect(handler).toHaveBeenCalledWith('tenant-1', 'hello');
    });

    it('doit exiger un PIN si requiresPin est true, et échouer si absent', async () => {
        const handler = vi.fn();
        const action = createSafeAction(z.tuple([z.string()]), { page: 'pos', action: 'void_ticket' }, handler);
        
        mockRequireSession.mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-1', role: 'manager' } as any);
        
        await expect(action('tenant-1', 'data-without-pin')).rejects.toThrow('Code PIN requis');
        expect(handler).not.toHaveBeenCalled();
    });

    it('doit valider le PIN si présent et correct (hash)', async () => {
        const handler = vi.fn().mockResolvedValue({ success: true });
        const action = createSafeAction(z.tuple([z.any()]), { page: 'pos', action: 'void_ticket' }, handler);
        
        mockRequireSession.mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-1', role: 'manager' } as any);
        
        vi.spyOn(Nexus.adapter, 'get').mockResolvedValue({ pinHash: 'hash', pinSalt: 'salt' } as any);
        vi.spyOn(PinHashService, 'verify').mockReturnValue(true);
        
        const result = await action('tenant-1', { data: 'hello', pin: '1234' });
        expect(result).toEqual({ success: true });
        expect(handler).toHaveBeenCalledWith('tenant-1', { data: 'hello', pin: '1234' });
    });

    it('doit rejeter si le PIN est incorrect', async () => {
        const handler = vi.fn();
        const action = createSafeAction(z.tuple([z.any()]), { page: 'pos', action: 'void_ticket' }, handler);
        
        mockRequireSession.mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-1', role: 'manager' } as any);
        
        vi.spyOn(Nexus.adapter, 'get').mockResolvedValue({ pinHash: 'hash', pinSalt: 'salt' } as any);
        vi.spyOn(PinHashService, 'verify').mockReturnValue(false);
        
        await expect(action('tenant-1', { data: 'hello', pin: 'wrong' })).rejects.toThrow('Code PIN incorrect');
        expect(handler).not.toHaveBeenCalled();
    });
});
