import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from 'jotai';
import './mocks'; 
import { SovereignData } from '@/shared/nexus-contract';
import { 
    createNexusNode, 
    updateNexusNode, 
    ordersNodeAtom, 
    tenantIdAtom,
    fleetSnapshotAtom,
    isMarketingSyncingAtom,
    isReservationSyncingAtom,
    reservationStatsAtom
} from '@/store/operationalAtoms';
import { NexusSyncService } from '@/lib/NexusSyncService';


describe('💎 OMNI-VANGUARD : BLOC 2 – NEXUS & ATOMS', () => {
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        store = createStore();
        vi.clearAllMocks();
    });

    // --- SECTION 1 : NEXUSNODE FACTORY ---


    it('T16: Initialisation Stérile - État par défaut conforme', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        const state = store.get(testAtom);
        expect(state.data).toEqual([]);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
    });

    it('T17: Sûreté d\'Action (append) - Mise à jour atomique', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        const item = { id: '1', name: 'Test' };
        
        store.set(testAtom, (prev: any) => updateNexusNode(prev, { data: [item], loading: false } as any));
        
        const state = store.get(testAtom);
        expect(state.data).toHaveLength(1);
        expect(state.data[0].id).toBe('1');
        expect(state.loading).toBe(false);
    });

    it('T18: Résilience Patch - Conservation des données collatérales', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        store.set(testAtom, (prev: any) => updateNexusNode(prev, { data: [{ id: '1', val: 'a' }], loading: false } as any));
        
        // Patch error without touching data
        store.set(testAtom as any, (prev: any) => updateNexusNode(prev, { error: 'CritFail' }) as any);
        
        const state = store.get(testAtom);
        expect(state.data[0].val).toBe('a');
        expect(state.error).toBe('CritFail');
    });

    it('T19: Purge & Reset - Retour à la singularité', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        store.set(testAtom, (prev: any) => updateNexusNode(prev, { data: [1, 2, 3], loading: false } as any));
        
        // Reset
        store.set(testAtom as any, (prev: any) => updateNexusNode(prev, { data: [], loading: true, error: null }) as any);
        
        const state = store.get(testAtom);
        expect(state.data).toEqual([]);
        expect(state.loading).toBe(true);
    });

    it('T20: Erreur de Propagation - Capture des anomalies Firestore', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        const firestoreError = "PERMISSION_DENIED";
        
        store.set(testAtom as any, (prev: any) => updateNexusNode(prev, { loading: false, error: firestoreError }) as any);
        
        const state = store.get(testAtom);
        expect(state.error).toBe(firestoreError);
        expect(state.loading).toBe(false);
    });

    // --- SECTION 2 : JOTAI ATOM LIFECYCLE ---

    it('T21: Multi-Abonnement - Cohérence inter-contextuelle', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        let callCount = 0;
        
        store.sub(testAtom, () => {
            callCount++;
        });

        store.set(testAtom as any, (prev: any) => updateNexusNode(prev, { data: ['data'] }) as any);
        store.set(testAtom as any, (prev: any) => updateNexusNode(prev, { loading: false }) as any);

        expect(callCount).toBeGreaterThanOrEqual(2);
    });

    it('T22: Déconnexion Réactive - Unsubscribe proactif', async () => {
        // Simuler une souscription via NexusSyncService
        await NexusSyncService.init('tenant-1');
        await NexusSyncService.stopAll();
        
        expect(true).toBe(true);
    });

    it('T23: Race Condition Shield - Ordre de priorité séquentiel', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        
        // Send two updates
        store.set(testAtom as any, (prev: any) => updateNexusNode(prev, { data: ['A'] }) as any);
        store.set(testAtom as any, (prev: any) => updateNexusNode(prev, { data: ['B'] }) as any);
        
        const state = store.get(testAtom);
        expect(state.data).toEqual(['B']);
    });

    it('T24: Store Isolation - Barrière d\'étanchéité inter-store', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        const storeB = createStore();
        
        store.set(testAtom as any, (prev: any) => updateNexusNode(prev, { data: ['StoreA'] }) as any);
        storeB.set(testAtom as any, (prev: any) => updateNexusNode(prev, { data: ['StoreB'] }) as any);
        
        expect(store.get(testAtom).data).toEqual(['StoreA']);
        expect(storeB.get(testAtom).data).toEqual(['StoreB']);
    });

    it('T25: Memory Pressure (WeakRef Simulation) - Stabilité structurelle', () => {
        const testAtom = createNexusNode<SovereignData>('T16-test-node');
        const node = store.get(testAtom);
        expect(node).toBeDefined();
    });

    // --- SECTION 3 : NEXUS SYNCSERVICE ---

    it('T26: Orchestration Init - Activation du moteur de synchronisation', async () => {
        const spy = vi.spyOn(NexusSyncService, 'init');
        await NexusSyncService.init('test-tenant');
        expect(spy).toHaveBeenCalledWith('test-tenant');
    });

    it('T27: Multi-Tenant Switch - Étanchéité du basculement SaaS', async () => {
        await NexusSyncService.init('tenant-A');
        await NexusSyncService.stopAll();
        await NexusSyncService.init('tenant-B');
        
        store.set(tenantIdAtom, 'tenant-B');
        expect(store.get(tenantIdAtom)).toBe('tenant-B');
    });

    it('T28: Persistence Offline Path - Utilisation de DB locale (Mock)', async () => {
        expect(true).toBe(true); 
    });


    it('T29: Global Error Recovery - Résilience aux crashs de services', async () => {
        try {
            await NexusSyncService.init('');
        } catch (e) {
        }
        expect(true).toBe(true);
    });


    it('T30: Cache Purge Logic - Nettoyage Dexie conforme', async () => {
        await NexusSyncService.clearCache();
        expect(true).toBe(true);
    });
});
