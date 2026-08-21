import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock Nexus.adapter (storage in-memory Map pour test)
const store = new Map<string, unknown>();
vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: vi.fn(async (path: string) => store.get(path) ?? null),
            set: vi.fn(async (path: string, value: unknown) => {
                store.set(path, JSON.parse(JSON.stringify(value)));
            }),
        },
    },
}));

describe('CrossScopeAuthority (persistant, ADR-014)', () => {
    beforeEach(async () => {
        store.clear();
        vi.clearAllMocks();
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        CrossScopeAuthority.clearCache();
    });

    it('grant() retourne un tokenId préfixé cst_ et persiste en Nexus', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'src/app/api/oracle/route.ts',
            reason: 'Cross-tenant strategic oracle',
            ttlSeconds: 60,
        });
        expect(token).toMatch(/^cst_/);
        expect(store.has(`mcc/crossScopeTokens/${token}`)).toBe(true);
    });

    it('grant() écrit une entrée d\'audit GRANT', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        await CrossScopeAuthority.grant({
            callerModule: 'audit-test',
            reason: 'test-audit',
            ttlSeconds: 60,
        });
        const auditKeys = Array.from(store.keys()).filter(k => k.startsWith('mcc/crossScopeAudit/grant_'));
        expect(auditKeys.length).toBe(1);
    });

    it('verify() retourne true pour un token valide', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'src/app/api/oracle/route.ts',
            reason: 'Test',
            ttlSeconds: 30,
        });
        expect(await CrossScopeAuthority.verify(token)).toBe(true);
    });

    it('verify() retourne false pour un token inexistant', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        expect(await CrossScopeAuthority.verify('cst_fake_token')).toBe(false);
    });

    it('verify() retourne false pour un token expiré', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'test',
            reason: 'ttl-0',
            ttlSeconds: 0,
        });
        await new Promise(r => setTimeout(r, 5));
        expect(await CrossScopeAuthority.verify(token)).toBe(false);
    });

    it('revealScope() retourne les targetScopes autorisés et incrémente revealCount', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'src/kernel/broadcast/RecallHandler.ts',
            reason: 'Fanout RappelConso',
            ttlSeconds: 60,
            targetScopes: ['tenants/bakery_a', 'tenants/bakery_b', 'tenants/restaurant_c'],
        });

        const scopes = await CrossScopeAuthority.revealScope(
            token,
            'src/kernel/broadcast/RecallHandler.ts',
        );
        expect(scopes).toEqual(['tenants/bakery_a', 'tenants/bakery_b', 'tenants/restaurant_c']);

        const stored = store.get(`mcc/crossScopeTokens/${token}`) as { revealCount: number; lastRevealedAt?: number };
        expect(stored.revealCount).toBe(1);
        expect(stored.lastRevealedAt).toBeDefined();
    });

    it('revealScope() refuse si callerModule ne matche pas le grant', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'legit-caller',
            reason: 'test',
            ttlSeconds: 60,
            targetScopes: ['tenants/x'],
        });
        await expect(
            CrossScopeAuthority.revealScope(token, 'malicious-caller'),
        ).rejects.toThrow(/ne correspond pas/);
    });

    it('revealScope() refuse un token expiré', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'test-expire',
            reason: 'test',
            ttlSeconds: 0,
            targetScopes: ['x'],
        });
        await new Promise(r => setTimeout(r, 5));
        await expect(
            CrossScopeAuthority.revealScope(token, 'test-expire'),
        ).rejects.toThrow(/expiré/);
    });

    it('revealScope() refuse un token révoqué', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'test-revoke',
            reason: 'test',
            ttlSeconds: 60,
            targetScopes: ['x'],
        });
        await CrossScopeAuthority.revoke(token, 'security-incident');
        await expect(
            CrossScopeAuthority.revealScope(token, 'test-revoke'),
        ).rejects.toThrow(/révoqué/);
    });

    it('revoke() persiste + audit', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'src/infrastructure/oracle/route.ts',
            reason: 'Test revoke',
            ttlSeconds: 300,
        });
        expect(await CrossScopeAuthority.verify(token)).toBe(true);
        await CrossScopeAuthority.revoke(token, 'operator_decision');
        expect(await CrossScopeAuthority.verify(token)).toBe(false);

        const stored = store.get(`mcc/crossScopeTokens/${token}`) as { revokedAt: number; revokedReason: string };
        expect(stored.revokedAt).toBeDefined();
        expect(stored.revokedReason).toBe('operator_decision');

        const auditRevokeKeys = Array.from(store.keys()).filter(k => k.startsWith('mcc/crossScopeAudit/revoke_'));
        expect(auditRevokeKeys.length).toBe(1);
    });

    it('token survit à un reboot (rechargé depuis Nexus)', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'survive-reboot',
            reason: 'test',
            ttlSeconds: 300,
            targetScopes: ['tenants/x'],
        });
        // Simuler un reboot : vider le cache mémoire, storage Nexus intact
        CrossScopeAuthority.clearCache();

        // Verify doit relire depuis Nexus et retourner true
        expect(await CrossScopeAuthority.verify(token)).toBe(true);
        const scopes = await CrossScopeAuthority.revealScope(token, 'survive-reboot');
        expect(scopes).toEqual(['tenants/x']);
    });

    it('cleanup() supprime les tokens expirés du cache (storage préservé)', async () => {
        const { CrossScopeAuthority } = await import('@/kernel/ai/core/CrossScopeAuthority');
        const token = await CrossScopeAuthority.grant({
            callerModule: 'test-cleanup',
            reason: 'test',
            ttlSeconds: 0,
        });
        await new Promise(r => setTimeout(r, 5));
        const cleaned = CrossScopeAuthority.cleanup();
        expect(cleaned).toBeGreaterThanOrEqual(1);
        // Le storage reste pour l'audit
        expect(store.has(`mcc/crossScopeTokens/${token}`)).toBe(true);
    });
});
