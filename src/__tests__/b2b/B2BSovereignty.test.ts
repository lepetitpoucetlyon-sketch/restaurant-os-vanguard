/**
 * b2b-arch-4 — Tests d'intégration souveraineté B2B
 *
 * Vérifie que :
 * 1. SecurityGuard.verifyTenantOwnership bloque un owner sur un tenant qui ne lui appartient pas
 * 2. YieldEngine.launchCampaign refuse les campagnes cross-owner
 * 3. SecurityGuard accepte un owner légitime
 * 4. SecurityGuard rejette un ownerId vide
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityGuard } from '@/lib/SecurityGuard';

// Mock Nexus.adapter
vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: vi.fn(),
            set: vi.fn(),
            delete: vi.fn(),
            query: vi.fn(() => []),
        },
    },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('B2B Sovereignty — SecurityGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('accepte un owner légitime', async () => {
        (Nexus.adapter.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            metadata: { ownerId: 'owner_alice' },
        });

        const result = await SecurityGuard.verifyTenantOwnership('owner_alice', 'tenant_resto_a');
        expect(result).toBe(true);
    });

    it('rejette un owner qui ne possède pas le tenant (breach cross-owner)', async () => {
        (Nexus.adapter.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            metadata: { ownerId: 'owner_alice' },
        });

        const result = await SecurityGuard.verifyTenantOwnership('owner_bob', 'tenant_resto_a');
        expect(result).toBe(false);
    });

    it('rejette si le tenant est introuvable', async () => {
        (Nexus.adapter.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

        const result = await SecurityGuard.verifyTenantOwnership('owner_alice', 'tenant_inexistant');
        expect(result).toBe(false);
    });

    it('rejette un ownerId vide', async () => {
        const result = await SecurityGuard.verifyTenantOwnership('', 'tenant_resto_a');
        expect(result).toBe(false);
    });

    it('rejette un tenantId vide', async () => {
        const result = await SecurityGuard.verifyTenantOwnership('owner_alice', '');
        expect(result).toBe(false);
    });

    it('rejette si Nexus.adapter.get lève une exception', async () => {
        (Nexus.adapter.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Firestore unavailable'));

        const result = await SecurityGuard.verifyTenantOwnership('owner_alice', 'tenant_resto_a');
        expect(result).toBe(false);
    });
});

describe('B2B Sovereignty — YieldEngine isolation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('bloque une campagne sur un tenant appartenant à un autre owner', async () => {
        // Simuler : owner_bob tente d'appliquer une promo sur le resto d'owner_alice
        (Nexus.adapter.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            metadata: { ownerId: 'owner_alice' }, // vrai propriétaire
        });

        // Import dynamique pour éviter des effets de bord au module level
        const { YieldEngine } = await import('@/modules/commerce/acquisition/marketing/services/YieldEngine');

         
        const spy = vi.spyOn(YieldEngine as any, 'applyStrategyToLocalTenant');

        await YieldEngine.launchCampaign({
            campaignId: 'test_breach',
            type: 'SURGE_PRICING',
            name: 'Breach attempt',
            ownerId: 'owner_bob', // mauvais owner
            targetTenantIds: ['tenant_resto_a'],
            rules: {
                priceModifierPercent: 20,
                startTimeMs: Date.now() - 1000,
                endTimeMs: Date.now() + 60000,
            },
            isAutopilot: false,
        });

        // applyStrategyToLocalTenant ne doit jamais être appelé
        expect(spy).not.toHaveBeenCalled();
    });

    it('autorise une campagne sur les propres tenants de l\'owner', async () => {
        (Nexus.adapter.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            metadata: { ownerId: 'owner_alice' }, // correspondance exacte
        });

        const { YieldEngine } = await import('@/modules/commerce/acquisition/marketing/services/YieldEngine');

        // Pas d'erreur lancée — la campagne passe
        await expect(
            YieldEngine.launchCampaign({
                campaignId: 'test_legit',
                type: 'FLASH_SALE',
                name: 'Flash légitime',
                ownerId: 'owner_alice',
                targetTenantIds: ['tenant_resto_a'],
                rules: {
                    priceModifierPercent: 10,
                    startTimeMs: Date.now() - 1000,
                    endTimeMs: Date.now() + 60000,
                },
                isAutopilot: false,
            })
        ).resolves.not.toThrow();
    });
});
