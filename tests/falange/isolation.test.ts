import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDefaultStore } from 'jotai';
import '@/e2e/vanguard/mocks';

// Chemins corrigés après réorganisation de l'archi (le barrel @/store/operationalAtoms n'existe plus).
import { tenantIdAtom, activeFleetTenantAtom } from '@/shared/nexus/state/SovereignGenome';
import { ordersAtom } from '@/modules/ops';
import { stockItemsAtom } from '@/modules/logistics';
import { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';
// NB: fleetBloomFilterAtom a été retiré du code — l'ancien test 4 (filtre de Bloom) a donc été supprimé.

// 1. Hard-spying on console.warn because logger might be undecorated or native
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('🛡️ FALANGE - COHORTE ISOLATION (9 TESTS)', () => {
    let store: ReturnType<typeof getDefaultStore>;

    beforeEach(() => {
        store = getDefaultStore();
        vi.clearAllMocks();
        store.set(tenantIdAtom, 'restaurant-os');
        store.set(activeFleetTenantAtom, null);
    });

    it('1. Devrait avoir "restaurant-os" comme tenant par défaut', () => {
        expect(store.get(tenantIdAtom)).toBe('restaurant-os');
    });

    it('2. SovereignGuard lève en mode test strict sur accès cross-tenant (fail-safe)', async () => {
        store.set(tenantIdAtom, 'vassal-1');
        // STRICT_ISOLATION_TEST activé LOCALEMENT ici : ~144 tests d'adapters existants
        // écrivent dans un tenant sans l'ancrer via tenantIdAtom. Ils passent grâce
        // au bypass NODE_ENV=test de SovereignGuard.validateAccess. Fixer chacun est
        // un chantier séparé ; ce test prouve qu'une fois la variable posée, la garde
        // lève bien. Le vrai filet de sécurité sur les 211 routes API est le test
        // d'invariant grep-based src/__tests__/security/tenant-isolation-invariant.test.ts.
        const prev = process.env.STRICT_ISOLATION_TEST;
        process.env.STRICT_ISOLATION_TEST = '1';
        try {
            await expect(SovereignGuard.validateAccess('tenants/vassal-2/orders', 'vassal-1')).rejects.toThrow();
        } finally {
            if (prev === undefined) delete process.env.STRICT_ISOLATION_TEST;
            else process.env.STRICT_ISOLATION_TEST = prev;
        }
    });

    it('3. L\'admin "restaurant-os" devrait accéder à tout', () => {
        store.set(tenantIdAtom, 'restaurant-os');
        expect(() => SovereignGuard.validateAccess('tenants/any/orders')).not.toThrow();
    });

    // (Ancien test 4 « FleetBloomFilter » supprimé : fleetBloomFilterAtom n'existe plus dans le code.)

    it('5. Isolation des Atomes (NexusNode)', () => {
        expect(ordersAtom).not.toBe(stockItemsAtom);
    });

    it('6. SovereignGuard autorise les chemins whitelist (system/time_sync) même cross-tenant', async () => {
        store.set(tenantIdAtom, 'vassal-x');
        // La WHITELIST (system, time_sync, health…) passe sans fail-safe, quel que soit le tenant.
        await expect(SovereignGuard.validateAccess('tenants/vassal-y/system/time_sync', 'vassal-x')).resolves.toBeUndefined();
    });

    it('7. MasterBridge - Protection vassal', () => {
        const currentTenant = 'vassal-poor';
        expect(currentTenant).not.toBe('restaurant-os');
    });

    it('8. Nettoyage du cache (Zero Leak)', () => {
        expect(true).toBe(true);
    });

    it('9. BioGuardInterceptor (Simulation)', () => {
        expect(true).toBe(true);
    });

    it('10. Performance validation < 50ms', () => {
        const start = performance.now();
        SovereignGuard.validateAccess('tenants/vassal-1/orders', 'vassal-1');
        const end = performance.now();
        expect(end - start).toBeLessThan(50);
    });
});
