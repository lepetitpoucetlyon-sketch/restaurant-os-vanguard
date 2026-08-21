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

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/adapters/OpsAlertGateway', () => ({
    OpsAlertGateway: {
        send: vi.fn().mockResolvedValue(undefined),
    },
}));

// Track quel provider est instancié (par nom)
const providerInstances: string[] = [];

vi.mock('@/modules/intelligence/ia/ai/LLMProviderFactory', () => ({
    createLLMProvider: vi.fn().mockImplementation((name: string) => {
        providerInstances.push(name);
        return {
            generateText: vi.fn().mockResolvedValue({
                text: `[${name}] response`,
                usage: { promptTokens: 12, completionTokens: 34 },
            }),
            generateFromImage: vi.fn().mockResolvedValue({
                text: `[${name}] vision`,
                usage: { promptTokens: 8, completionTokens: 16 },
            }),
        };
    }),
}));

// Track télémétrie
const telemetryPaths: Array<{ path: string; scope: 'mcc' | 'tenant' }> = [];

vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: vi.fn(),
            set: vi.fn().mockImplementation(async (path: string) => {
                if (path.startsWith('mcc/telemetry/llm_spend/')) {
                    telemetryPaths.push({ path, scope: 'mcc' });
                }
                if (path.startsWith('tenants/') && path.includes('/telemetry/llm_spend/')) {
                    telemetryPaths.push({ path, scope: 'tenant' });
                }
                return undefined;
            }),
        },
    },
}));

describe('AI Scope E2E — Isolation multi-tenant + multi-vertical', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        providerInstances.length = 0;
        telemetryPaths.length = 0;
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('Scénario 1 : Tenant bakery mode cloud → appel utilise Gemini (jamais souverain)', async () => {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        vi.mocked(Nexus.adapter.get).mockResolvedValue({
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

        const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
        TenantAIRegistry.invalidate('bakery_t1');
        const registry = await TenantAIRegistry.forTenant(
            'bakery_t1',
            'src/modules/intelligence/services/MacroBrain.ts',
        );

        expect(registry.providerName).toBe('gemini');

        await registry.provider.generateText({ model: '', userPrompt: 'test bakery' });

        // Aucun provider souverain n'a été instancié
        expect(providerInstances).toContain('gemini');
        expect(providerInstances).not.toContain('sovereign');

        // Télémétrie écrite dans le path tenant (pas MCC)
        const tenantTelem = telemetryPaths.filter(t => t.scope === 'tenant');
        expect(tenantTelem.length).toBeGreaterThan(0);
        expect(tenantTelem[0].path).toContain('tenants/bakery_t1/telemetry/llm_spend');

        const mccTelem = telemetryPaths.filter(t => t.scope === 'mcc');
        expect(mccTelem.length).toBe(0);
    });

    it('Scénario 2 : Tenant clinic mode souverain → SLM local, JAMAIS Gemini', async () => {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        vi.mocked(Nexus.adapter.get).mockResolvedValue({
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

        const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
        TenantAIRegistry.invalidate('clinic_t2');
        const registry = await TenantAIRegistry.forTenant(
            'clinic_t2',
            'src/modules/intelligence/services/MacroBrain.ts',
            'reasoning',
        );

        expect(registry.providerName).toBe('sovereign');

        await registry.provider.generateText({ model: '', userPrompt: 'test clinic HDS' });

        expect(providerInstances).toContain('sovereign');
        expect(providerInstances).not.toContain('gemini');
        expect(providerInstances).not.toContain('anthropic');

        // Télémétrie écrite pour clinic_t2 uniquement
        const tenantTelem = telemetryPaths.filter(t => t.scope === 'tenant');
        expect(tenantTelem[0].path).toContain('tenants/clinic_t2/telemetry/llm_spend');
    });

    it('Scénario 3 : MCC diagnose → utilise le provider MCC (anthropic), jamais un provider tenant', async () => {
        process.env.MCC_LLM_PRIMARY_PROVIDER = 'anthropic';
        process.env.MCC_LLM_FALLBACK_CHAIN = 'anthropic';
        process.env.MCC_LLM_ANTHROPIC_API_KEY = 'sk-ant-mcc-only';
        process.env.MCC_LLM_ANTHROPIC_MODEL = 'claude-sonnet-5';
        // Ces clés tenant ne doivent JAMAIS servir au MCC
        process.env.GEMINI_API_KEY = 'clef-tenant-gemini';

        const { MCCAIRegistry } = await import('@/kernel/ai/mcc/MCCAIRegistry');
        MCCAIRegistry.reset();

        await MCCAIRegistry.provider.generateText({ model: '', userPrompt: 'diagnose MCC' });

        expect(MCCAIRegistry.activeProviderName).toBe('anthropic');
        expect(providerInstances).toContain('anthropic');
        expect(providerInstances).not.toContain('gemini');

        // Télémétrie MCC bien isolée
        const mccTelem = telemetryPaths.filter(t => t.scope === 'mcc');
        expect(mccTelem.length).toBeGreaterThan(0);
        expect(mccTelem[0].path).toContain('mcc/telemetry/llm_spend');

        // Aucune télémétrie tenant écrite pour un appel MCC
        const tenantTelem = telemetryPaths.filter(t => t.scope === 'tenant');
        expect(tenantTelem.length).toBe(0);
    });

    it('Isolation : un caller MCC ne peut PAS accéder à TenantAIRegistry', async () => {
        const { AIScopeGuard } = await import('@/kernel/ai/core/AIScopeGuard');

        expect(() =>
            AIScopeGuard.assertTenantScope('src/app/api/admin/fleet/support-ai/diagnose/route.ts'),
        ).toThrow(/VIOLATION R1/);
    });

    it('Isolation : un caller tenant ne peut PAS accéder à MCCAIRegistry', async () => {
        const { AIScopeGuard } = await import('@/kernel/ai/core/AIScopeGuard');

        expect(() =>
            AIScopeGuard.assertMCCScope('src/modules/ops/service/pos/hooks/usePos.ts'),
        ).toThrow(/VIOLATION R1/);
    });

    it('Détection scope naturel des chemins', async () => {
        const { AIScopeGuard } = await import('@/kernel/ai/core/AIScopeGuard');

        expect(AIScopeGuard.detectScope('src/app/api/admin/fleet/xxx')).toBe('mcc');
        expect(AIScopeGuard.detectScope('src/kernel/ai/mcc/xxx')).toBe('mcc');
        expect(AIScopeGuard.detectScope('src/modules/finance/xxx')).toBe('tenant');
        expect(AIScopeGuard.detectScope('src/app/api/tenant/xxx')).toBe('tenant');
        expect(AIScopeGuard.detectScope('src/lib/unknown/xxx')).toBe('unknown');
    });

    it('Deux tenants concurrents : leurs providers sont indépendants', async () => {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        vi.mocked(Nexus.adapter.get).mockImplementation(async (path: string) => {
            if (path.includes('salon_a')) {
                return {
                    id: 'salon_a',
                    variant: 'salon',
                    aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] },
                };
            }
            if (path.includes('garage_b')) {
                return {
                    id: 'garage_b',
                    variant: 'garage',
                    aiSettings: { mode: 'souverain', fallbackChain: ['sovereign'] },
                };
            }
            return null;
        });

        process.env.GEMINI_API_KEY = 'gemini-shared';
        process.env.SOVEREIGN_SLM_URL = 'http://sovereign-shared';

        const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
        TenantAIRegistry.invalidate('salon_a');
        TenantAIRegistry.invalidate('garage_b');

        const r1 = await TenantAIRegistry.forTenant('salon_a', 'src/modules/intelligence/services/MacroBrain.ts');
        const r2 = await TenantAIRegistry.forTenant('garage_b', 'src/modules/intelligence/services/MacroBrain.ts');

        expect(r1.providerName).toBe('gemini');
        expect(r2.providerName).toBe('sovereign');
        expect(r1.tenantId).not.toBe(r2.tenantId);
    });
});
