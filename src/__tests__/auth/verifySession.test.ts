import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireSession } from '@/lib/server/verifySession';
import { NexusError, NexusErrorCode } from '@nexus/errors';

vi.mock('@/lib/firebase-admin-init', () => ({
    initFirebaseAdmin: vi.fn(),
}));

const mockVerifyIdToken = vi.fn();

vi.mock('firebase-admin/auth', () => ({
    getAuth: vi.fn(() => ({
        verifyIdToken: mockVerifyIdToken,
    }))
}));

describe('requireSession', () => {
    beforeEach(() => {
        mockVerifyIdToken.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('doit lever une erreur si aucun en-tête Authorization', async () => {
        const mockRequest = { headers: { get: () => null } } as any;
        
        try {
            await requireSession('tenant-123', mockRequest);
            expect.fail('Should have thrown an error');
        } catch (e: any) {
            expect(e).toBeInstanceOf(NexusError);
            expect(e.code).toBe(NexusErrorCode.ACCESS_DENIED);
            expect(e.message).toBe('[ACCESS_DENIED] Session invalide ou expirée');
        }
    });

    it('doit lever une erreur si le jeton est invalide/expiré', async () => {
        const mockRequest = { headers: { get: () => 'Bearer invalid-token' } } as any;
        mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));
        
        try {
            await requireSession('tenant-123', mockRequest);
            expect.fail('Should have thrown an error');
        } catch (e: any) {
            expect(e).toBeInstanceOf(NexusError);
            expect(e.code).toBe(NexusErrorCode.ACCESS_DENIED);
            expect(e.message).toBe('[ACCESS_DENIED] Session invalide ou expirée');
        }
    });

    it('doit lever une erreur si le jeton appartient à un autre tenant', async () => {
        const mockRequest = { headers: { get: () => 'Bearer valid-token' } } as any;
        mockVerifyIdToken.mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-456' });
        
        try {
            await requireSession('tenant-123', mockRequest);
            expect.fail('Should have thrown an error');
        } catch (e: any) {
            expect(e).toBeInstanceOf(NexusError);
            expect(e.code).toBe(NexusErrorCode.ACCESS_DENIED);
            expect(e.message).toBe('[ACCESS_DENIED] Jeton émis pour un autre tenant');
        }
    });

    it('doit retourner le jeton décodé si le jeton est valide pour le bon tenant', async () => {
        const mockRequest = { headers: { get: () => 'Bearer valid-token' } } as any;
        const mockDecodedToken = { uid: 'user-1', tenantId: 'tenant-123' };
        mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
        
        const result = await requireSession('tenant-123', mockRequest);
        
        expect(result).toEqual(mockDecodedToken);
    });
});
