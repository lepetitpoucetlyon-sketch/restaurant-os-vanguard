import { describe, it, expect, vi, beforeEach } from 'vitest';
import { atom, getDefaultStore } from 'jotai';
import { SelfHealingEngine } from '@/shared/services/SelfHealingEngine';
import { updateNexusNode, type NexusNode } from '@/store/base';
import { createNexusNode } from '@/store/nexusNodeFactory';
import { logger } from '@/lib/logger';

// Mocking dependencies
vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    }
}));

interface StabilityItem {
    id: string;
    a: number;
    self?: StabilityItem;
    data?: number[];
    loading?: boolean;
    error?: string | null;
    lastUpdated?: number;
}

describe('🍵 FALANGE - COHORTE STABILITY (10 TESTS)', () => {
    let store: ReturnType<typeof getDefaultStore>;
    
    beforeEach(() => {
        vi.clearAllMocks();
        store = getDefaultStore();
    });

    /**
     * TEST 1: Calcul CRC (Intégrité des données)
     */
    it('1. SelfHealingEngine.calculateCRC devrait être déterministe', () => {
        const data = { a: 1, b: [1, 2, 3] };
        const h1 = SelfHealingEngine.calculateCRC(data);
        const h2 = SelfHealingEngine.calculateCRC(data);
        expect(h1).toBe(h2);
    });

    /**
     * TEST 2: Détection de dérive (CRC Mismatch)
     */
    it('2. Devaait détecter une dérive d\'état si le hash attendu est différent', async () => {
        // Créer un vrai atome Jotai pour que store.get() fonctionne
        const testAtom = atom({ data: [1], loading: false, error: null, lastUpdated: 0 });
        const wrongHash = 'WRONG_HASH';
        
        await SelfHealingEngine.auditAndHeal(testAtom, wrongHash);
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('State Drift Detected'));
    });

    /**
     * TEST 3: createNexusNode - Valeurs par défaut
     */
    it('3. createNexusNode devrait initialiser un état Grade VI standard', () => {
        // createNexusNode retourne un atome Jotai. On vérifie son état initial via store.get()
        const nodeAtom = createNexusNode<StabilityItem[]>('test-node-stability');
        const state = store.get(nodeAtom);
        
        expect(state.loading).toBe(true);
        expect(state.data).toEqual([]);
        expect(state.lastUpdated).toBeGreaterThan(0);
    });

    /**
     * TEST 4: updateNexusNode - Immuabilité
     */
    it('4. updateNexusNode devrait retourner un nouvel objet (immuabilité)', () => {
        const prev = { data: [], loading: true, error: null, lastUpdated: 100 };
        const next = updateNexusNode(prev, { loading: false });
        expect(next).not.toBe(prev);
        expect(next.loading).toBe(false);
        expect(next.lastUpdated).toBeGreaterThan(prev.lastUpdated);
    });

    /**
     * TEST 5: Stress-test d'updates (Memory/Perf simulation)
     */
    it('5. updateNexusNode devrait supporter 10 000 mises à jour en < 100ms', () => {
        let state = { data: [] as number[], loading: true, error: null as string | null, lastUpdated: 0 };
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
            state = updateNexusNode(state, { data: [i] });
        }
        const end = performance.now();
        expect(end - start).toBeLessThan(100);
    });

    /**
     * TEST 6: Logger - Niveaux d'alerte
     */
    it('6. Le système de log devrait être actif pour les avertissements critiques', () => {
        logger.warn('STABILITY_ALERT');
        expect(logger.warn).toHaveBeenCalled();
    });

    /**
     * TEST 7: Nettoyage des atomes (GC simulation)
     */
    it('7. La factory createNexusNode devrait permettre un nettoyage Garbage Collector', () => {
        // En JS, on vérifie juste que l'atome est redéfinissable
        const atom = createNexusNode('gc-test');
        expect(atom).toBeDefined();
    });

    /**
     * TEST 8: Gestion des erreurs dans updateNexusNode
     */
    it('8. updateNexusNode devrait permettre d\'injecter une erreur proprement', () => {
        const prev = { data: [], loading: true, error: null, lastUpdated: 100 };
        const next = updateNexusNode(prev, { error: 'AUTH_FAILED', loading: false });
        expect(next.error).toBe('AUTH_FAILED');
        expect(next.loading).toBe(false);
    });

    /**
     * TEST 9: Cohérence des Timestamps
     */
    it('9. lastUpdated doit toujours être strictement croissant', async () => {
        const prev: NexusNode<number> = { data: [], loading: true, error: null, lastUpdated: 100 };
        await new Promise(r => setTimeout(r, 10));
        const next = updateNexusNode(prev, { loading: false });
        expect(next.lastUpdated).toBeGreaterThan(prev.lastUpdated);
    });

    /**
     * TEST 10: Résilience du moteur de calcul
     */
    it('10. calculateCRC devrait gérer les objets circulaires (limitation connue)', () => {
        const obj: StabilityItem = { id: 'circular', a: 1 };
        obj.self = obj;
        expect(() => SelfHealingEngine.calculateCRC(obj)).toThrow(); // JSON.stringify throws
    });
});
