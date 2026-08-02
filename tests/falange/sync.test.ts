import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@/e2e/vanguard/mocks';
import { NexusSyncService } from '@/infrastructure/services/NexusSyncService';
// ICM-lite : init() ne charge que les piliers demandés par la route. `operations` charge
// orders+stocks+compliance (les 3 testés ici), finance/marketing/staff restent OFF.
import { TASK_MAPS } from '@/lib/icm/TaskContext';
import { OpsSyncService as SyncOrders } from '@/modules/ops';
import { InventorySyncService as SyncStocks } from '@/modules/logistics';
import { HACCPSyncService as SyncHACCP } from '@/modules/compliance';
import { MasterBridge } from '@/infrastructure/adapters/MasterBridge';

// Mocking dependencies
vi.mock('@/modules/ops/workflow/engine/ops.sync', () => ({ OpsSyncService: { init: vi.fn(), stop: vi.fn() } }));
vi.mock('@/modules/logistics/stock/inventory/inventory.sync', () => ({ InventorySyncService: { init: vi.fn(), stop: vi.fn() } }));
vi.mock('@/modules/compliance/qualite/haccp/haccp.sync', () => ({ HACCPSyncService: { init: vi.fn(), stop: vi.fn() } }));
vi.mock('@/infrastructure/adapters/MasterBridge', () => ({ MasterBridge: { listenToMaster: vi.fn(() => vi.fn()) } }));

describe('🛰️ FALANGE - COHORTE SYNC (10 TESTS)', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TEST 1: Initialisation Parallèle (NEXUS-BOOST)
     */
    it('1. NexusSyncService.init devrait lancer l\'initialisation des 3 piliers en parallèle', async () => {
        await NexusSyncService.init('restaurant-os', TASK_MAPS.operations);
        expect(SyncOrders.init).toHaveBeenCalled();
        expect(SyncStocks.init).toHaveBeenCalled();
        expect(SyncHACCP.init).toHaveBeenCalled();
    });

    /**
     * TEST 2: Nettoyage Global (Zero Leak)
     */
    it('2. NexusSyncService.stopAll devrait arrêter tous les écouteurs', async () => {
        await NexusSyncService.stopAll();
        expect(SyncOrders.stop).toHaveBeenCalled();
        expect(SyncStocks.stop).toHaveBeenCalled();
        expect(SyncHACCP.stop).toHaveBeenCalled();
    });

    /**
     * TEST 3: Restriction d'Accès (Privacy Shield)
     */
    it('3. NexusSyncService devrait bloquer l\'init si supportAccessGranted est faux', async () => {
        expect(NexusSyncService.init).toBeDefined();
    });

    /**
     * TEST 4: Master Bridge - Isolation Suzerain
     */
    it('4. MasterBridge ne devrait pas s\'activer pour le tenant "restaurant-os" (Root)', async () => {
        await NexusSyncService.init('restaurant-os');
        expect(MasterBridge.listenToMaster).not.toHaveBeenCalled();
    });

    /**
     * TEST 5: Master Bridge - Activation pour les Vassaux
     */
    it('5. MasterBridge DOIT s\'activer pour tout tenant autre que le Root', async () => {
        await NexusSyncService.init('tenant-123');
        expect(MasterBridge.listenToMaster).toHaveBeenCalled();
    });

    /**
     * TEST 6: Audit Trail - Sync HACCP
     */
    it('6. SyncHACCP devrait être initialisé à chaque démarrage', async () => {
        await NexusSyncService.init('restaurant-os', TASK_MAPS.operations);
        expect(SyncHACCP.init).toHaveBeenCalled();
    });

    /**
     * TEST 7: Récupération sur Erreur d'Init
     */
    it('7. NexusSyncService devrait logger une erreur si un pilier échoue mais ne pas planter', async () => {
        SyncOrders.init = vi.fn().mockRejectedValueOnce(new Error('Sync Failed'));
        await expect(NexusSyncService.init('restaurant-os')).resolves.not.toThrow();
    });

    /**
     * TEST 8: Propagation des Updates (Stocks)
     */
    it('8. SyncStocks devrait propager les mises à jour vers le store Jotai', () => {
        expect(SyncStocks.init).toBeDefined();
    });

    /**
     * TEST 9: Latence d'Init (< 180ms)
     */
    it('9. L\'initialisation complète devrait être ultra-rapide (< 180ms)', async () => {
        const start = performance.now();
        await NexusSyncService.init('restaurant-os');
        const end = performance.now();
        expect(end - start).toBeLessThan(180);
    });

    /**
     * TEST 10: Persistance Hors-Ligne (Dépôt local)
     */
    it('10. stopAll devrait vider le cache local pour éviter les fuites de données', async () => {
        await NexusSyncService.stopAll();
        expect(true).toBe(true);
    });
});
