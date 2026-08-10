import { getDefaultStore } from 'jotai';
import { nexusStatusAtom } from '@/shared/atoms/nexusStatus.atom';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { db } from '@/lib/offline/offline-store';
import { bootSyncManager } from '@/lib/offline/sync-manager';
import { NexusBridge } from '@/lib/nexus/NexusBridge';
import { TelemetryService } from '@/lib/nexus/TelemetryService';
import { Mutex } from '@/lib/utils/Mutex';
import { TaskContext, TASK_MAPS, readZcpoState, degradeImportanceMap } from '@/lib/icm';
import { registerNexusHandlers, unregisterNexusHandlers } from '@/shared/eventBus/registerHandlers';
import { startDLQRetryService, stopDLQRetryService } from '@/shared/eventBus/DLQRetryService';
import { initPillarSyncs, stopPillarSyncs } from './sync/pillarSyncRegistry';
// VerticalRegistry / CoreContext sont importés dynamiquement dans init() :
// VerticalRegistry lazy-importe les verticales, qui remontent jusqu'ici — un
// import statique referme le cycle et laisse RestaurantVertical partiellement
// initialisée (ses handlers ne s'enregistrent plus).
import { evaluatePrivacyGate, evaluateGenomeGate } from './sync/syncGates';
import { initMasterBridgeListener } from './sync/masterBridgeInit';
import { startSelfHealingInterval } from './sync/selfHealingInit';
import { replayPendingEvents } from './sync/outboxReplayer';

const syncMutex = new Mutex();

/**
 * 🛰️ NexusSyncService - Restaurant OS (Orchestrator)
 * High-performance orchestrator for specialized real-time synchronization.
 * Grade IX: Protected by GenomeValidator — no sync without valid DNA.
 *
 * Découpé (god file) : les sous-services de pilier vivent dans `sync/pillarSyncRegistry`,
 * les gates de sécurité dans `sync/syncGates`. Cet orchestrateur ne fait plus que
 * séquencer : cleanup → suture infra → gates → sync sélective.
 */
export const NexusSyncService = {
  healing_interval: null as NodeJS.Timeout | null,
  master_unsub: null as (() => void) | null,

  /**
   * Initializes operational listeners in parallel.
   * Avec ICM-lite : seuls les modules déclarés HIGH/MEDIUM dans le TaskContext sont initialisés.
   * Target switch time: < 180ms.
   */
  async init(tenantId: string, task?: TaskContext) {
    const icm = task ?? TASK_MAPS.default;
    const result = await syncMutex.run(async () => {
        const store = getDefaultStore();

        // 1. CLEANUP CACHE & LISTENERS (Zero Leak Policy)
        await this._stopAllInternal();

        // 0. ANCHOR CONTEXT (Security Barrier)
        Nexus.tenantOverride = tenantId;
        store.set(nexusStatusAtom, { isActive: true, isProcessing: false });

        logger.info(`[NexusSyncService] Initializing Atomic Discovery for Tenant: ${tenantId}...`);

        // --- OMPHALOS SUTURE (Mission 1 & 3) ---
        await NexusBridge.init(tenantId);
        TelemetryService.start(tenantId);

        // --- OFFLINE RESILIENCE : vide la file Dexie au boot + au retour réseau ---
        bootSyncManager();
        await this.replayPendingEvents();

        // --- EVENT BUS HANDLERS ---
        registerNexusHandlers();
        startDLQRetryService();

        // --- ZCPO × ICM degradation — ajuste l'importance map selon pression mémoire ---
        const zcpoState = await readZcpoState();
        const icmDegraded = { ...icm, importance: degradeImportanceMap(icm.importance, zcpoState) };
        if (zcpoState?.memoryPressure !== 'normal' && zcpoState !== null) {
          logger.warn(`[NexusSyncService] ZCPO pressure=${zcpoState.memoryPressure} — ICM dégradé`);
        }

        // --- MASTER BRIDGE SUTURE ---
        this.master_unsub = initMasterBridgeListener(tenantId, store);

        // --- SELF-HEALING ACTIVATION (Grade X+) ---
        this.healing_interval = startSelfHealingInterval(tenantId);

        // --- PRIVACY SHIELD GATE (Grade X) ---
        if (!(await evaluatePrivacyGate(tenantId, store))) {
            return;
        }

        // --- GENOME HEALTH GATE (Grade IX) ---
        if (!(await evaluateGenomeGate(tenantId, store))) {
            return;
        }

        // 2. PARALLEL INITIALIZATION — ICM-lite selective sync
        const imp = icmDegraded.importance;
        logger.info(`[NexusSyncService][ICM] Task="${icm.taskId}" — chargement sélectif activé.`);
        const initStart = performance.now();
        try {
            // --- VERTICAL PLUGIN ACTIVATION (H-01) ---
            // Le variant vient de la config tenant (défaut 'restaurant'). Imports
            // dynamiques : cf. note en tête de fichier (cycle d'initialisation).
            try {
                const [{ VerticalRegistry }, { CoreContext }] = await Promise.all([
                    import('@/shared/plugins/VerticalRegistry'),
                    import('@/shared/plugins/CoreContext'),
                ]);
                const tenantConfig = await Nexus.adapter.get<{ variant?: string }>(
                    `tenants/${tenantId}/config/main`
                );
                const variant = (tenantConfig?.variant ?? 'restaurant') as import('@nexus/contracts').PlatformVariant;
                const vertical = VerticalRegistry.resolve(variant);
                await vertical.initialize(new CoreContext());
                logger.info(`[NexusSyncService] Vertical "${variant}" initialisée pour le tenant ${tenantId}`);
            } catch (verticalError) {
                logger.warn('[NexusSyncService] Init verticale échouée (non bloquant)', verticalError);
            }

            await initPillarSyncs(imp, tenantId, store);

            const duration = performance.now() - initStart;
            logger.info(`[NexusSyncService] Atomic Parallel Sync established for ${tenantId} in ${duration.toFixed(2)}ms.`);
            if (duration > 180) {
                logger.warn(`[NexusSyncService] PERFORMANCE ALERT: Init took ${duration.toFixed(2)}ms (> 180ms target)`);
            }
        } catch (error) {
            logger.error('[NexusSyncService] Atomic Initialization Failed!', error);
        }
    });

    if (result === null) {
        logger.warn('[NexusSyncService] Initialisation interceptée par le Mutex (Lock & Abort).');
    }
  },

  /**
   * Stops all sub-services and purges the local cache.
   */
  async stopAll() {
    return syncMutex.run(async () => {
        await this._stopAllInternal();
    });
  },

  /**
   * Internal stop method (not locked) for use within mutex blocks.
   */
  async _stopAllInternal() {
    logger.info('[NexusSyncService] Orchestrating Global Stop...');
    getDefaultStore().set(nexusStatusAtom, { isActive: false, isProcessing: false });
    if (this.healing_interval) {
        clearInterval(this.healing_interval);
        this.healing_interval = null;
    }

    stopPillarSyncs();

    if (this.master_unsub) {
        this.master_unsub();
        this.master_unsub = null;
    }
    NexusBridge.stop();
    TelemetryService.stop();
    unregisterNexusHandlers();
    stopDLQRetryService();

    try {
        await db.clearAll();
        logger.info('[NexusSyncService] Offline cache cleared.');
    } catch (error) {
        logger.error('[NexusSyncService] Failed to clear offline cache!', error);
    }
  },

  async clearCache() {
    return this.stopAll();
  },

  /**
   * P0-1: Rejoue les événements bloqués dans l'Outbox au démarrage.
   */
  async replayPendingEvents(): Promise<void> {
    return replayPendingEvents();
  }
};
