import { getDefaultStore } from 'jotai';
import { nexusStatusAtom } from '@/shared/atoms/nexusStatus.atom';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { bootSyncManager } from '@/lib/offline/sync-manager';
import { NexusBridge } from '@/lib/nexus/NexusBridge';
import { TelemetryService } from '@/lib/nexus/TelemetryService';
import { TaskContext, TASK_MAPS, readZcpoState, degradeImportanceMap } from '@/lib/icm';
import { startDLQRetryService } from '@/shared/eventBus/DLQRetryService';
import { initPillarSyncs } from './pillarSyncRegistry';
import { evaluatePrivacyGate, evaluateGenomeGate } from './syncGates';
import { initMasterBridgeListener } from './masterBridgeInit';
import { startSelfHealingInterval } from './selfHealingInit';
import { replayPendingEvents } from './outboxReplayer';

export interface NexusSyncBootstrapResult {
  master_unsub: (() => void) | null;
  healing_interval: NodeJS.Timeout | null;
}

/**
 * Bootstrap séquence complète du NexusSyncService.
 * Extrait du god file NexusSyncService.ts (fan-out 16 → shell orchestrator).
 *
 * Séquence :
 *   1. Anchor tenant + status
 *   2. Nexus Bridge + Telemetry
 *   3. Offline resilience + outbox replay
 *   4. Event bus handlers + DLQ retry
 *   5. ZCPO × ICM degradation
 *   6. Master bridge + self-healing
 *   7. Privacy + Genome gates
 *   8. Parallel pillar syncs (ICM-lite selective)
 */
export async function bootstrapNexusSync(
  tenantId: string,
  task?: TaskContext,
): Promise<NexusSyncBootstrapResult | null> {
  const icm = task ?? TASK_MAPS.default;
  const store = getDefaultStore();

  Nexus.tenantOverride = tenantId;
  store.set(nexusStatusAtom, { isActive: true, isProcessing: false });

  logger.info(`[NexusSyncService] Initializing Atomic Discovery for Tenant: ${tenantId}...`);

  await NexusBridge.init(tenantId);
  TelemetryService.start(tenantId);

  bootSyncManager();
  await replayPendingEvents();

  const { registerNexusHandlers } = await import('@/shared/eventBus/registerHandlers');
  registerNexusHandlers();
  startDLQRetryService();

  const zcpoState = await readZcpoState();
  const icmDegraded = { ...icm, importance: degradeImportanceMap(icm.importance, zcpoState) };
  if (zcpoState?.memoryPressure !== 'normal' && zcpoState !== null) {
    logger.warn(`[NexusSyncService] ZCPO pressure=${zcpoState.memoryPressure} — ICM dégradé`);
  }

  const master_unsub = initMasterBridgeListener(tenantId, store);
  const healing_interval = startSelfHealingInterval(tenantId);

  if (!(await evaluatePrivacyGate(tenantId, store))) return { master_unsub, healing_interval };
  if (!(await evaluateGenomeGate(tenantId, store))) return { master_unsub, healing_interval };

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

  return { master_unsub, healing_interval };
}
