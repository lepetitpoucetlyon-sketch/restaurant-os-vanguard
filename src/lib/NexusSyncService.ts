import { getDefaultStore } from 'jotai';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { db } from './offline/offline-store';
import { 
  ordersNodeAtom, 
  stockItemsNodeAtom, 
  fiscalLedgerNodeAtom,
  updateNexusNode
} from '@/store/operationalAtoms';

// Import Sovereign Modular sub-services
import { OpsSyncService as SyncOrders } from '@/modules/ops/ops.sync';
import { InventorySyncService as SyncStocks } from '@/modules/inventory/inventory.sync';
import { FinanceSyncService as SyncFinance } from '@/modules/finance/finance.sync';
import { HACCPSyncService as SyncHACCP } from '@/modules/haccp/haccp.sync';
import { MarketingSyncService as SyncMarketing } from '@/modules/marketing/marketing.sync';
import { HRSyncService as SyncStaff } from '@/modules/hr/hr.sync';

import { NexusBridge } from './nexus/NexusBridge';
import { TelemetryService } from './nexus/TelemetryService';
import { TimeSync } from './TimeSync';

import { Mutex } from './utils/Mutex';

// Grade IX: Genome Immunity
import { genomeValidator } from '@/domain/services/GenomeValidator';
import { ImmunityAuditLogger } from './services/ImmunityAuditLogger';

const syncMutex = new Mutex();

/**
 * 🛰️ NexusSyncService - Restaurant OS (Orchestrator)
 * High-performance orchestrator for specialized real-time synchronization.
 * Grade IX: Protected by GenomeValidator — no sync without valid DNA.
 */
export const NexusSyncService = {
  /**
   * Initializes all operational listeners in parallel.
   * Target switch time: < 180ms.
   */
  async init(tenantId: string) {
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

        // --- PRIVACY SHIELD GATE ---
        const { fleetSnapshotAtom } = await import('@/store/operationalAtoms');
        const instances = store.get(fleetSnapshotAtom) || [];
        const instance = instances.find(i => i.key === tenantId);

        const isRestricted = tenantId !== 'restaurant-os' && instance && !instance.security?.supportAccessGranted;
        
        if (isRestricted) {
            logger.warn(`[NexusSyncService] ACCESS RESTRICTED for tenant ${tenantId}.`);
            store.set(ordersNodeAtom, (prev) => updateNexusNode(prev, { loading: false }));
            store.set(stockItemsNodeAtom, (prev) => updateNexusNode(prev, { loading: false }));
            store.set(fiscalLedgerNodeAtom, (prev) => updateNexusNode(prev, { loading: false }));
            return;
        }

        // --- GENOME HEALTH GATE (Grade IX) ---
        const genomeCheck = genomeValidator.validatePower('DASHBOARD', 'SYNC_STATE');
        if (!genomeCheck.allowed) {
            logger.error(`[NexusSyncService] GENOME HEALTH GATE FAILED: ${genomeCheck.reason}`);
            await ImmunityAuditLogger.log({
                moduleId: genomeCheck.moduleId,
                attemptedPower: genomeCheck.action,
                reason: genomeCheck.reason === 'AUTHORIZED' ? 'UNKNOWN' : genomeCheck.reason,
                blockedDependency: genomeCheck.blockedDependency,
                tenantId
            });
            store.set(ordersNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: 'GENOME_INTEGRITY_FAILURE' }));
            store.set(stockItemsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: 'GENOME_INTEGRITY_FAILURE' }));
            store.set(fiscalLedgerNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: 'GENOME_INTEGRITY_FAILURE' }));
            return;
        }

        // 2. PARALLEL INITIALIZATION (NEXUS-BOOST)
        try {
            await Promise.all([
                TimeSync.init(),
                SyncOrders.init(tenantId, store),
                SyncStocks.init(tenantId, store),
                SyncFinance.init(tenantId, store),
                SyncHACCP.init(tenantId, store),
                SyncMarketing.init(tenantId, store),
                SyncStaff.init(tenantId, store)
            ]);
            
            logger.info(`[NexusSyncService] Atomic Parallel Sync established for ${tenantId}.`);
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
    TimeSync.stop();
    SyncOrders.stop();
    SyncStocks.stop();
    SyncFinance.stop();
    SyncHACCP.stop();
    SyncMarketing.stop();
    SyncStaff.stop();
    
    NexusBridge.stop();
    TelemetryService.stop();

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
