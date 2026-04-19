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

// Import Atomic sub-services
import { SyncOrders } from './sync/Sync.Orders';
import { SyncStocks } from './sync/Sync.Stocks';
import { SyncCompliance } from './sync/Sync.Compliance';
import { SyncStaff } from './sync/Sync.Staff';
import { NexusBridge } from './nexus/NexusBridge';
import { TelemetryService } from './nexus/TelemetryService';
import { TimeSync } from './TimeSync';

// Grade IX: Genome Immunity
import { genomeValidator } from '@/domain/services/GenomeValidator';
import { ImmunityAuditLogger } from './services/ImmunityAuditLogger';

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
    const store = getDefaultStore();
    
    // 1. CLEANUP CACHE & LISTENERS (Zero Leak Policy)
    await this.stopAll();

    // 0. ANCHOR CONTEXT (Security Barrier)
    Nexus.tenantOverride = tenantId;
    
    logger.info(`[NexusSyncService] Initializing Atomic Discovery for Tenant: ${tenantId}...`);

    // --- OMPHALOS SUTURE (Mission 1 & 3) ---
    // Establish real-time command bridge immediately for configuration & features
    await NexusBridge.init(tenantId);
    TelemetryService.start(tenantId);

    // --- PRIVACY SHIELD GATE ---
    // Access core instances to check Support Access
    const { fleetSnapshotAtom } = await import('@/store/operationalAtoms');
    const instances = store.get(fleetSnapshotAtom) || [];
    const instance = instances.find(i => i.key === tenantId);

    const isRestricted = tenantId !== 'restaurant-os' && instance && !instance.security?.supportAccessGranted;
    
    if (isRestricted) {
        logger.warn(`[NexusSyncService] ACCESS RESTRICTED for tenant ${tenantId}.`);
        store.set(ordersNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false }));
        store.set(stockItemsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false }));
        store.set(fiscalLedgerNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false }));
        return;
    }

    // --- GENOME HEALTH GATE (Grade IX) ---
    // Le Dashboard est le node racine. S'il ne peut pas SYNC_STATE,
    // le système est en état de corruption génomique.
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
        // ABORT: Ne pas lancer les listeners si le génome est corrompu
        store.set(ordersNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: 'GENOME_INTEGRITY_FAILURE' }));
        store.set(stockItemsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: 'GENOME_INTEGRITY_FAILURE' }));
        store.set(fiscalLedgerNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: 'GENOME_INTEGRITY_FAILURE' }));
        return;
    }

    // 2. PARALLEL INITIALIZATION (NEXUS-BOOST)
    try {
        await Promise.all([
            TimeSync.init(),
            SyncOrders.init(tenantId, store),
            SyncStocks.init(tenantId, store),
            SyncCompliance.init(tenantId, store),
            SyncStaff.init(tenantId, store)
        ]);
        
        logger.info(`[NexusSyncService] Atomic Parallel Sync fully established for ${tenantId}. Genome: VALID.`);
    } catch (error) {
        logger.error('[NexusSyncService] Atomic Initialization Failed!', error);
    }
  },

  /**
   * Stops all sub-services and purges the local cache.
   */
  async stopAll() {
    logger.info('[NexusSyncService] Orchestrating Global Stop...');
    
    // 1. Stop all specialized listeners
    TimeSync.stop();
    SyncOrders.stop();
    SyncStocks.stop();
    SyncCompliance.stop();
    SyncStaff.stop();
    NexusBridge.stop();
    TelemetryService.stop();

    // 2. Clear local IndexedDB (Nuclear Purge)
    try {
        await db.clearAll();
        logger.info('[NexusSyncService] Offline cache cleared successfully.');
    } catch (error) {
        logger.error('[NexusSyncService] Failed to clear offline cache!', error);
    }
  },

  /**
   * Alias for stopAll (Nuclear Purge)
   */
  async clearCache() {
    return this.stopAll();
  }
};
