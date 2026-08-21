import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('CrossScopeAuthority', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('grant() retourne un tokenId', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        CrossScopeAuthority.cleanup();

        const token = CrossScopeAuthority.grant({
            callerModule: 'src/app/api/oracle/route.ts',
            reason: 'Cross-tenant strategic oracle',
            ttlSeconds: 60,
        });

        expect(token).toMatch(/^cst_/);
    });

    it('verify() retourne true pour un token valide', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        CrossScopeAuthority.cleanup();

        const token = CrossScopeAuthority.grant({
            callerModule: 'src/app/api/oracle/route.ts',
            reason: 'Test',
            ttlSeconds: 30,
        });

        expect(CrossScopeAuthority.verify(token)).toBe(true);
    });

    it('verify() retourne false pour un token inexistant', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        expect(CrossScopeAuthority.verify('cst_fake_token')).toBe(false);
    });

    it('revoke() invalide immédiatement le token', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        CrossScopeAuthority.cleanup();

        const token = CrossScopeAuthority.grant({
            callerModule: 'src/infrastructure/oracle/route.ts',
            reason: 'Test revoke',
            ttlSeconds: 300,
        });

        expect(CrossScopeAuthority.verify(token)).toBe(true);
        CrossScopeAuthority.revoke(token);
        expect(CrossScopeAuthority.verify(token)).toBe(false);
    });

    it('cleanup() supprime les tokens expirés', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        CrossScopeAuthority.cleanup(); // clean state

        // Grant avec TTL 0 (déjà expiré au prochain check)
        const token = CrossScopeAuthority.grant({
            callerModule: 'test-module',
            reason: 'Test TTL 0',
            ttlSeconds: 0,
        });

        // Attendre 10ms pour que le token expire
        await new Promise(r => setTimeout(r, 10));

        const cleaned = CrossScopeAuthority.cleanup();
        expect(cleaned).toBeGreaterThanOrEqual(1);
        expect(CrossScopeAuthority.verify(token)).toBe(false);
    });

    it('activeCount reflète le nombre de tokens actifs', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        CrossScopeAuthority.cleanup();

        const before = CrossScopeAuthority.activeCount;
        CrossScopeAuthority.grant({ callerModule: 'mod-a', reason: 'r', ttlSeconds: 60 });
        CrossScopeAuthority.grant({ callerModule: 'mod-b', reason: 'r', ttlSeconds: 60 });

        expect(CrossScopeAuthority.activeCount).toBe(before + 2);
    });
});
