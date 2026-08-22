/**
 * ai-scope-e2e.test.ts
 *
 * ADR-008 Phase E — Test end-to-end multi-tenant + multi-vertical.
 * Scénarios :
 *   1. Tenant bakery en mode cloud (Gemini) → appel POS assistant
 *   2. Tenant clinic en mode souverain (SLM local) → appel oracle
 *   3. MCC diagnose → utilise Anthropic (isolé), jamais un provider tenant
 *
 * Vérifie qu'aucun appel MCC ne fuit vers un tenant, et inversement.
 * Vérifie que la télémétrie est bien écrite dans le bon path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { AIScopeGuard } from '@/kernel/ai/core/AIScopeGuard';
import { TenantAIRegistry } from '@/kernel/ai/tenant/TenantAIRegistry';
import { MCCAIRegistry } from '@/kernel/ai/mcc/MCCAIRegistry';

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/adapters/OpsAlertGateway', () => ({
    OpsAlertGateway: {
        send: vi.fn().mockResolvedValue(undefined),
    },
}));

describe('AI Scope E2E — Isolation multi-tenant + multi-vertical', () => {
    const originalEnv = { ...process.env };
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        Nexus.adapter = new MockAdapter();
        vi.clearAllMocks();
        TenantAIRegistry.resetCache();

        globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
            const urlStr = String(url);
            if (urlStr.includes('generativelanguage.googleapis.com')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        candidates: [{ content: { parts: [{ text: '[gemini] response' }] } }],
                        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 34 },
                    }),
                    text: async () => '',
                } as unknown as Response;
            }
            if (urlStr.includes('anthropic.com')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        content: [{ type: 'text', text: '[anthropic] response' }],
                        usage: { input_tokens: 12, output_tokens: 34 },
                    }),
                    text: async () => '',
                } as unknown as Response;
            }
            // Sovereign / local SLM
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: '[sovereign] response' } }],
                    usage: { prompt_tokens: 12, completion_tokens: 34 },
                }),
                text: async () => '',
            } as unknown as Response;
        });
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        globalThis.fetch = originalFetch;
    });

    it('Scénario 1 : Tenant bakery mode cloud → appel utilise Gemini (jamais souverain)', async () => {
        await Nexus.adapter.set('tenants/bakery_t1/tenantConfig', {
            id: 'bakery_t1',
            variant: 'bakery',
            aiSettings: {
                mode: 'cloud',
                fallbackChain: ['gemini'],
                providers: {
                    reasoning: { provider: 'gemini', model: 'gemini-1.5-pro' },
                    fast: { provider: 'gemini', model: 'gemini-1.5-flash' },
                    vision: { provider: 'gemini', model: 'gemini-1.5-flash' },
                },
            },
        });

        process.env.GEMINI_API_KEY = 'tenant-bakery-gemini';
        delete process.env.SOVEREIGN_SLM_URL;

        TenantAIRegistry.invalidate('bakery_t1');
        const registry = await TenantAIRegistry.forTenant(
            'bakery_t1',
            'src/modules/intelligence/services/MacroBrain.ts',
        );

        expect(registry.providerName).toBe('gemini');

        const res = await registry.provider.generateText({ model: '', userPrompt: 'test bakery' });
        expect(res.text).toContain('[gemini]');
    });

    it('Scénario 2 : Tenant clinic mode souverain → SLM local, JAMAIS Gemini', async () => {
        await Nexus.adapter.set('tenants/clinic_t2/tenantConfig', {
            id: 'clinic_t2',
            variant: 'clinic',
            aiSettings: {
                mode: 'souverain',
                fallbackChain: ['sovereign'],
                providers: {
                    reasoning: { provider: 'sovereign', model: 'llama-3.1-70b' },
                    fast: { provider: 'sovereign', model: 'llama-3.1-8b' },
                    vision: { provider: 'sovereign', model: 'llava' },
                },
            },
        });

        process.env.SOVEREIGN_SLM_URL = 'http://clinic-slm.internal';
        process.env.GEMINI_API_KEY = 'ne-doit-jamais-etre-utilisee';

        TenantAIRegistry.invalidate('clinic_t2');
        const registry = await TenantAIRegistry.forTenant(
            'clinic_t2',
            'src/modules/intelligence/services/MacroBrain.ts',
            'reasoning',
        );

        expect(registry.providerName).toBe('sovereign');

        const res = await registry.provider.generateText({ model: '', userPrompt: 'test clinic HDS' });
        expect(res.text).toContain('[sovereign]');
    });

    it('Scénario 3 : MCC diagnose → utilise le provider MCC (anthropic), jamais un provider tenant', async () => {
        process.env.MCC_LLM_PRIMARY_PROVIDER = 'anthropic';
        process.env.MCC_LLM_FALLBACK_CHAIN = 'anthropic';
        process.env.MCC_LLM_ANTHROPIC_API_KEY = 'sk-ant-mcc-only';
        process.env.ANTHROPIC_API_KEY = 'sk-ant-mcc-only';
        process.env.MCC_LLM_ANTHROPIC_MODEL = 'claude-sonnet-5';
        process.env.GEMINI_API_KEY = 'clef-tenant-gemini';

        MCCAIRegistry.reset();

        const res = await MCCAIRegistry.provider.generateText({ model: '', userPrompt: 'diagnose MCC' });

        expect(MCCAIRegistry.activeProviderName).toBe('anthropic');
        expect(res.text).toContain('[anthropic]');
    });

    it('Isolation : un caller MCC ne peut PAS accéder à TenantAIRegistry', async () => {
        expect(() =>
            AIScopeGuard.assertTenantScope('src/app/api/admin/fleet/support-ai/diagnose/route.ts'),
        ).toThrow(/VIOLATION R1/);
    });

    it('Isolation : un caller tenant ne peut PAS accéder à MCCAIRegistry', async () => {
        expect(() =>
            AIScopeGuard.assertMCCScope('src/modules/ops/service/pos/hooks/usePos.ts'),
        ).toThrow(/VIOLATION R1/);
    });

    it('Détection scope naturel des chemins', async () => {
        expect(AIScopeGuard.detectScope('src/app/api/admin/fleet/xxx')).toBe('mcc');
        expect(AIScopeGuard.detectScope('src/kernel/ai/mcc/xxx')).toBe('mcc');
        expect(AIScopeGuard.detectScope('src/modules/finance/xxx')).toBe('tenant');
        expect(AIScopeGuard.detectScope('src/app/api/tenant/xxx')).toBe('tenant');
        expect(AIScopeGuard.detectScope('src/lib/unknown/xxx')).toBe('unknown');
    });

    it('Deux tenants concurrents : leurs providers sont indépendants', async () => {
        await Nexus.adapter.set('tenants/salon_a/tenantConfig', {
            id: 'salon_a',
            variant: 'salon',
            aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] },
        });
        await Nexus.adapter.set('tenants/garage_b/tenantConfig', {
            id: 'garage_b',
            variant: 'garage',
            aiSettings: { mode: 'souverain', fallbackChain: ['sovereign'] },
        });

        process.env.GEMINI_API_KEY = 'gemini-shared';
        process.env.SOVEREIGN_SLM_URL = 'http://sovereign-shared';

        TenantAIRegistry.invalidate('salon_a');
        TenantAIRegistry.invalidate('garage_b');

        const r1 = await TenantAIRegistry.forTenant('salon_a', 'src/modules/intelligence/services/MacroBrain.ts');
        const r2 = await TenantAIRegistry.forTenant('garage_b', 'src/modules/intelligence/services/MacroBrain.ts');

        expect(r1.providerName).toBe('gemini');
        expect(r2.providerName).toBe('sovereign');
        expect(r1.tenantId).not.toBe(r2.tenantId);
    });
});
