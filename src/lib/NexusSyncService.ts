import { getDefaultStore } from 'jotai';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { db } from './offline/offline-store';
import { bootSyncManager } from './offline/sync-manager';
import { ordersNodeAtom } from '@/store/pillars/ops';

import { NexusBridge } from './nexus/NexusBridge';
import { TelemetryService } from './nexus/TelemetryService';
import { MasterBridge } from './MasterBridge';

import { Mutex } from './utils/Mutex';
import { TaskContext, TASK_MAPS } from './icm/TaskContext';
import { registerNexusHandlers, unregisterNexusHandlers } from './events/registerHandlers';
import { readZcpoState, degradeImportanceMap } from './icm/zcpoBridge';

import { SelfHealingEngine } from '@shared/services/SelfHealingEngine';

// Sous-modules extraits (réduction du fan-out — voir ARCHITECTURE.md §9 P2)
import { initPillarSyncs, stopPillarSyncs } from './sync/pillarSyncRegistry';
import { evaluatePrivacyGate, evaluateGenomeGate } from './sync/syncGates';
import { DEFAULT_TENANT_ID, APP_MODE } from '@/config/instance';

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

        logger.info(`[NexusSyncService] Initializing Atomic Discovery for Tenant: ${tenantId}...`);

        // --- OMPHALOS SUTURE (Mission 1 & 3) ---
        await NexusBridge.init(tenantId);
        TelemetryService.start(tenantId);

        // --- OFFLINE RESILIENCE : vide la file Dexie au boot + au retour réseau ---
        // (bootSyncManager n'était appelé nulle part : les tickets NF525 mis en
        //  file hors-ligne n'étaient JAMAIS resynchronisés.)
        bootSyncManager();

        // --- EVENT BUS HANDLERS ---
        registerNexusHandlers();

        // --- ZCPO × ICM degradation — ajuste l'importance map selon pression mémoire ---
        const zcpoState = await readZcpoState();
        const icmDegraded = { ...icm, importance: degradeImportanceMap(icm.importance, zcpoState) };
        if (zcpoState?.memoryPressure !== 'normal' && zcpoState !== null) {
          logger.warn(`[NexusSyncService] ZCPO pressure=${zcpoState.memoryPressure} — ICM dégradé`);
        }

        // --- MASTER BRIDGE SUTURE ---
        // MCC mode IS the master — it writes masterConfig, never listens.
        // Tenant mode vassals subscribe to master orders.
        if (APP_MODE === 'tenant' && tenantId !== 'restaurant-os' && tenantId !== DEFAULT_TENANT_ID && tenantId !== 'vanguard') {
            this.master_unsub = MasterBridge.listenToMaster(store);
        }

        // --- SELF-HEALING ACTIVATION (Grade X+) ---
        this.healing_interval = setInterval(() => {
          // Audit critical state nodes
          SelfHealingEngine.auditAndHeal(ordersNodeAtom, 'legacy_audit', `tenants/${tenantId}/orders`).catch(() => {});
        }, 60000);

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

    try {
        await db.clearAll();
        logger.info('[NexusSyncService] Offline cache cleared.');
    } catch (error) {
        logger.error('[NexusSyncService] Failed to clear offline cache!', error);
    }
  },

  async clearCache() {
    return this.stopAll();
  }
};
