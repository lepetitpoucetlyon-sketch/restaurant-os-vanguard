import { getDefaultStore } from 'jotai';
import { nexusStatusAtom } from '@/shared/atoms/nexusStatus.atom';
import { logger } from '@/lib/logger';
import { db } from '@/lib/offline/offline-store';
import { NexusBridge } from '@/lib/nexus/NexusBridge';
import { TelemetryService } from '@/lib/nexus/TelemetryService';
import { stopDLQRetryService } from '@/shared/eventBus/DLQRetryService';
import { stopPillarSyncs } from '@/shared/nexus/sync/pillarSyncRegistry';

export interface NexusSyncRuntimeHandles {
  healing_interval: NodeJS.Timeout | null;
  master_unsub: (() => void) | null;
}

/**
 * Shutdown séquence complète du NexusSyncService.
 * Extrait du god file NexusSyncService.ts (fan-out 16 → shell orchestrator).
 *
 * Séquence inverse du bootstrap :
 *   1. Status inactive
 *   2. Clear healing interval
 *   3. Stop pillar syncs
 *   4. Master unsub
 *   5. Nexus Bridge + Telemetry stop
 *   6. Unregister handlers + DLQ stop
 *   7. Clear offline cache
 */
export async function shutdownNexusSync(handles: NexusSyncRuntimeHandles): Promise<void> {
  logger.info('[NexusSyncService] Orchestrating Global Stop...');
  getDefaultStore().set(nexusStatusAtom, { isActive: false, isProcessing: false });

  if (handles.healing_interval) {
    clearInterval(handles.healing_interval);
    handles.healing_interval = null;
  }

  stopPillarSyncs();

  if (handles.master_unsub) {
    handles.master_unsub();
    handles.master_unsub = null;
  }

  NexusBridge.stop();
  TelemetryService.stop();

  const { unregisterNexusHandlers } = await import('@/shared/eventBus/registerHandlers');
  unregisterNexusHandlers();
  stopDLQRetryService();

  try {
    await db.clearAll();
    logger.info('[NexusSyncService] Offline cache cleared.');
  } catch (error) {
    logger.error('[NexusSyncService] Failed to clear offline cache!', error);
  }
}
