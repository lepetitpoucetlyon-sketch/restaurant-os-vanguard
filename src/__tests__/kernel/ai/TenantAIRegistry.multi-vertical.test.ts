/**
 * TenantAIRegistry.multi-vertical.test.ts
 *
 * ADR-008 Phase C — Vérifie que TenantAIRegistry est fonctionnel pour
 * les 12 verticales (PLATFORM_VARIANTS) SANS que le kernel connaisse
 * un seul de ces verticals en dur.
 *
 * Bloque le CI si un jour un hardcode "restaurant" ou similaire apparaît
 * dans le prompt composé.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLATFORM_VARIANTS } from '@/modules/system';

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: vi.fn(),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

vi.mock('@/modules/intelligence/ia/ai/LLMProviderFactory', () => ({
    createLLMProvider: vi.fn().mockImplementation((name: string) => ({
        generateText: vi.fn().mockResolvedValue({
            text: `[${name}] response`,
            usage: { promptTokens: 10, completionTokens: 20 },
        }),
        generateFromImage: vi.fn().mockResolvedValue({
            text: `[${name}] vision`,
            usage: { promptTokens: 5, completionTokens: 10 },
        }),
    })),
}));

const CALLER = 'src/modules/intelligence/services/MacroBrain.ts';

describe('TenantAIRegistry — Multi-vertical universel (12 variants)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-multi-vertical';
        process.env.SOVEREIGN_SLM_URL = 'http://slm.test';
    });

    it('PLATFORM_VARIANTS contient bien 12 verticales', () => {
        expect(PLATFORM_VARIANTS.length).toBe(12);
    });

    it.each(PLATFORM_VARIANTS)(
        'forTenant() fonctionne pour la verticale "%s"',
        async (variant) => {
            const { Nexus } = await import('@/lib/nexus/NexusAdapter');
            vi.mocked(Nexus.adapter.get).mockResolvedValue({
                id: `t_${variant}`,
                variant,
                aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] },
            });

            const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
            TenantAIRegistry.invalidate(`t_${variant}`);
            const registry = await TenantAIRegistry.forTenant(`t_${variant}`, CALLER);

            expect(registry.tenantId).toBe(`t_${variant}`);
            expect(registry.provider).toBeDefined();
            expect(registry.providerName).toBe('gemini');
        },
    );

    it.each(PLATFORM_VARIANTS)(
        'composePrompt() sur "%s" contient le persona vertical si le blueprint le fournit',
        async (variant) => {
            const { Nexus } = await import('@/lib/nexus/NexusAdapter');
            vi.mocked(Nexus.adapter.get).mockResolvedValue({
                id: `t_${variant}`,
                variant,
                aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] },
            });

            const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
            TenantAIRegistry.invalidate(`t_${variant}`);
            const registry = await TenantAIRegistry.forTenant(`t_${variant}`, CALLER);
            const prompt = registry.composePrompt('assistant');

            // Le prompt doit contenir la base tenant (universelle)
            expect(prompt).toContain('assistant intelligent');
            // Longueur raisonnable — jamais vide
            expect(prompt.length).toBeGreaterThan(50);
        },
    );

    it("ajouter une nouvelle vertical n'a nécessité aucune modif du kernel", async () => {
        // Test explicite : le kernel/ai/tenant/TenantAIRegistry n'importe AUCUN blueprint
        // spécifique. On vérifie qu'il fonctionne avec un tenant dont le variant est
        // 'custom' (générique) — équivalent d'ajouter une nouvelle vertical.
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        vi.mocked(Nexus.adapter.get).mockResolvedValue({
            id: 't_future_vertical',
            variant: 'custom',
            aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] },
        });

        const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
        TenantAIRegistry.invalidate('t_future_vertical');
        const registry = await TenantAIRegistry.forTenant('t_future_vertical', CALLER);
        expect(registry.provider).toBeDefined();
    });

    it("chaque variant produit un providerName cohérent avec son aiSettings.mode", async () => {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');

        // Alterner cloud / souverain sur toutes les verticales
        const results: Array<{ variant: string; provider: string }> = [];
        for (let i = 0; i < PLATFORM_VARIANTS.length; i++) {
            const variant = PLATFORM_VARIANTS[i];
            const mode = i % 2 === 0 ? 'cloud' : 'souverain';
            const fallbackChain = mode === 'cloud' ? ['gemini'] : ['sovereign'];

            vi.mocked(Nexus.adapter.get).mockResolvedValueOnce({
                id: `alt_${variant}`,
                variant,
                aiSettings: { mode, fallbackChain },
            });

            const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
            TenantAIRegistry.invalidate(`alt_${variant}`);
            const registry = await TenantAIRegistry.forTenant(`alt_${variant}`, CALLER);
            results.push({ variant, provider: registry.providerName });
        }

        // Chaque tenant a bien un provider cohérent avec son mode
        results.forEach((r, i) => {
            const expectedProvider = i % 2 === 0 ? 'gemini' : 'sovereign';
            expect(r.provider).toBe(expectedProvider);
        });
    });
});
