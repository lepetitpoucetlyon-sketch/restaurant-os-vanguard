import { logger } from '@/lib/logger';
import { db } from '@/lib/offline/offline-store';
import { NexusEventBus, type NexusEventName } from '@orchestration/NexusEventBus';
import { PayloadMigrator } from '@orchestration/PayloadMigrator';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { JsonObject } from "@/shared/types/json";

/**
 * Rejoue les événements bloqués dans l'Outbox au démarrage.
 */
export async function replayPendingEvents(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const pending = await db.busOutbox.where('status').equals('pending').toArray();
    if (pending.length > 0) {
      logger.info(`[NexusSyncService] Replaying ${pending.length} pending events from Outbox...`);

      try {
        const { SyncManager } = await import('@/lib/offline/sync-manager');
        await SyncManager.processQueue();
      } catch (e) {
        logger.error('[NexusSyncService] Échec du re-scellement NF525 lors du replay', e);
      }

      for (const entry of pending) {
        const migratedPayload = PayloadMigrator.migrate(entry.eventName as NexusEventName, entry.payload as JsonObject);
        await NexusEventBus.emit(entry.eventName as NexusEventName, migratedPayload);
        await db.busOutbox.update(entry.id, { status: 'done' });
      }

      empireAudit.log({
        module: 'fiscal',
        action: 'OFFLINE_SYNC_VERIFIED',
        details: { replayedCount: pending.length, tenantId: Nexus.tenantOverride ?? 'unknown' },
        severity: 'high',
        timestamp: new Date(),
      });
    }
  } catch (err) {
    logger.error('[NexusSyncService] Failed to replay pending events from Outbox', err);
  }
}
