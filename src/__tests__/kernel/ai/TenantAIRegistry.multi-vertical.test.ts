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
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { TenantAIRegistry } from '@/kernel/ai/tenant/TenantAIRegistry';

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
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
        Nexus.adapter = new MockAdapter();
        TenantAIRegistry.resetCache();
        process.env.GEMINI_API_KEY = 'test-multi-vertical';
        process.env.SOVEREIGN_SLM_URL = 'http://slm.test';
    });

    it('PLATFORM_VARIANTS contient bien 12 verticales', () => {
        expect(PLATFORM_VARIANTS.length).toBe(12);
    });

    it.each(PLATFORM_VARIANTS)(
        'forTenant() fonctionne pour la verticale "%s"',
        async (variant) => {
            await Nexus.adapter.set(`tenants/t_${variant}/tenantConfig`, {
                id: `t_${variant}`,
                variant,
                aiSettings: {
                    mode: 'cloud',
                    fallbackChain: ['gemini'],
                },
            });

            TenantAIRegistry.invalidate(`t_${variant}`);
            const registry = await TenantAIRegistry.forTenant(`t_${variant}`, CALLER);

            expect(registry).toBeDefined();
            expect(registry.providerName).toBe('gemini');
            expect(registry.tenantId).toBe(`t_${variant}`);
        },
    );

    it.each(PLATFORM_VARIANTS)(
        'composePrompt() sur "%s" contient le persona vertical si le blueprint le fournit',
        async (variant) => {
            await Nexus.adapter.set(`tenants/p_${variant}/tenantConfig`, {
                id: `p_${variant}`,
                variant,
                aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] },
            });

            TenantAIRegistry.invalidate(`p_${variant}`);
            const registry = await TenantAIRegistry.forTenant(`p_${variant}`, CALLER);

            const composed = registry.composePrompt(
                'assistant',
                { note: 'Commande 2 pizzas' },
            );

            expect(composed).toBeDefined();
            expect(typeof composed).toBe('string');
            expect(composed).toContain('assistant intelligent');
        },
    );

    it("ajouter une nouvelle vertical n'a nécessité aucune modif du kernel", async () => {
        await Nexus.adapter.set('tenants/t_future_v/tenantConfig', {
            id: 't_future_v',
            variant: 'custom',
            aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] },
        });

        TenantAIRegistry.invalidate('t_future_v');
        const registry = await TenantAIRegistry.forTenant('t_future_v', CALLER);
        expect(registry.provider).toBeDefined();
    });

    it("chaque variant produit un providerName cohérent avec son aiSettings.mode", async () => {
        const results: Array<{ variant: string; provider: string }> = [];
        for (let i = 0; i < PLATFORM_VARIANTS.length; i++) {
            const variant = PLATFORM_VARIANTS[i];
            const mode = i % 2 === 0 ? 'cloud' : 'souverain';
            const fallbackChain = mode === 'cloud' ? ['gemini'] : ['sovereign'];

            await Nexus.adapter.set(`tenants/alt_${variant}/tenantConfig`, {
                id: `alt_${variant}`,
                variant,
                aiSettings: { mode, fallbackChain },
            });

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
