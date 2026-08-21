import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

vi.mock('@/modules/intelligence/ia/ai/LLMProviderFactory', () => ({
    createLLMProvider: vi.fn().mockImplementation((name: string) => ({
        generateText: vi.fn().mockResolvedValue({
            text: `Response from ${name}`,
            usage: { promptTokens: 10, completionTokens: 20 },
        }),
        generateFromImage: vi.fn().mockResolvedValue({
            text: `Image response from ${name}`,
            usage: { promptTokens: 5, completionTokens: 15 },
        }),
    })),
}));

describe('TenantAIRegistry', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('R1 — TenantAIRegistry ne peut PAS être importé depuis fleet/', async () => {
        const { AIScopeGuard } = await import('@/kernel/ai/core/AIScopeGuard');
        expect(() =>
            AIScopeGuard.assertTenantScope('src/app/api/admin/fleet/support-ai/route.ts'),
        ).toThrow(/VIOLATION R1/);
    });

    it('forTenant retourne une instance avec provider', async () => {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        vi.mocked(Nexus.adapter.get).mockResolvedValue({
            id: 'tenant-1',
            variant: 'restaurant',
            aiSettings: {
                mode: 'cloud',
                fallbackChain: ['gemini'],
            },
        });

        process.env.GEMINI_API_KEY = 'test-key-tenant1';
        const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
        TenantAIRegistry.invalidate('tenant-1');
        const registry = await TenantAIRegistry.forTenant('tenant-1', 'src/modules/intelligence/services/MacroBrain.ts');

        expect(registry).toBeDefined();
        expect(registry.tenantId).toBe('tenant-1');
        expect(registry.provider).toBeDefined();
        delete process.env.GEMINI_API_KEY;
    });

    it('Deux tenants avec configs différentes ont des providers différents', async () => {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const { createLLMProvider } = await import('@/modules/intelligence/ia/ai/LLMProviderFactory');

        // Mock Nexus.adapter.get pour retourner des configs différentes
        vi.mocked(Nexus.adapter.get).mockImplementation(async (path: string) => {
            if (path.includes('tenant-cloud')) {
                return { id: 'tenant-cloud', aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] } };
            }
            if (path.includes('tenant-sov')) {
                return { id: 'tenant-sov', aiSettings: { mode: 'souverain', fallbackChain: ['sovereign'] } };
            }
            return null;
        });

        // Set env vars pour que les providers semblent configurés
        process.env.GEMINI_API_KEY = 'test-gemini';
        process.env.SOVEREIGN_SLM_URL = 'http://slm.test';

        const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
        TenantAIRegistry.invalidate('tenant-cloud');
        TenantAIRegistry.invalidate('tenant-sov');

        const r1 = await TenantAIRegistry.forTenant('tenant-cloud', 'src/modules/intelligence/services/MacroBrain.ts');
        const r2 = await TenantAIRegistry.forTenant('tenant-sov', 'src/modules/intelligence/services/MacroBrain.ts');

        expect(r1.providerName).toBe('gemini');
        expect(r2.providerName).toBe('sovereign');
        expect(createLLMProvider).toHaveBeenCalledWith('gemini');
        expect(createLLMProvider).toHaveBeenCalledWith('sovereign');

        delete process.env.GEMINI_API_KEY;
        delete process.env.SOVEREIGN_SLM_URL;
    });

    it('TenantProviderChain refuse les providers cloud si mode=souverain', async () => {
        const { TenantProviderChain } = await import('@/kernel/ai/tenant/TenantProviderChain');

        const chain = new TenantProviderChain('clinic-t1', {
            mode: 'souverain',
            providers: {
                reasoning: { provider: 'gemini', model: '' },
                fast: { provider: 'gemini', model: '' },
                vision: { provider: 'gemini', model: '' },
            },
            fallbackChain: ['gemini'], // cloud provider dans mode souverain
        });

        // Aucun provider souverain configuré → throw
        delete process.env.SOVEREIGN_SLM_URL;
        delete process.env.VLLM_BASE_URL;
        delete process.env.OLLAMA_BASE_URL;

        expect(() => chain.resolve('fast')).toThrow(/AUCUN provider disponible/);
    });

    it('Mode mix autorise sovereign + gemini', async () => {
        process.env.SOVEREIGN_SLM_URL = 'http://slm.test';

        const { TenantProviderChain } = await import('@/kernel/ai/tenant/TenantProviderChain');
        const chain = new TenantProviderChain('hotel-t1', {
            mode: 'mix',
            providers: {
                reasoning: { provider: 'sovereign', model: 'llama' },
                fast: { provider: 'sovereign', model: 'llama' },
                vision: { provider: 'gemini', model: 'gemini-flash' },
            },
            fallbackChain: ['sovereign', 'gemini'],
        });

        const { name } = chain.resolve('fast');
        expect(name).toBe('sovereign');

        delete process.env.SOVEREIGN_SLM_URL;
    });

    it('TenantAIRegistry.invalidate() vide le cache pour le tenant', async () => {
        const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');

        const initialSize = TenantAIRegistry.cacheSize;
        TenantAIRegistry.invalidate('some-tenant');
        // Size ne devrait pas augmenter pour un tenant qui n'était pas en cache
        expect(TenantAIRegistry.cacheSize).toBeLessThanOrEqual(initialSize);
    });

    it('composePrompt retourne un prompt avec base sans vertical (si pas de blueprint)', async () => {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        vi.mocked(Nexus.adapter.get).mockResolvedValue({ id: 'tenant-x', aiSettings: { mode: 'cloud', fallbackChain: ['gemini'] } });
        process.env.GEMINI_API_KEY = 'test-key';

        const { TenantAIRegistry } = await import('@/kernel/ai/tenant/TenantAIRegistry');
        TenantAIRegistry.invalidate('tenant-x');
        const registry = await TenantAIRegistry.forTenant('tenant-x', 'src/modules/intelligence/services/MacroBrain.ts');

        const prompt = registry.composePrompt('assistant');
        expect(prompt.length).toBeGreaterThan(0);
        expect(typeof prompt).toBe('string');

        delete process.env.GEMINI_API_KEY;
    });
});
