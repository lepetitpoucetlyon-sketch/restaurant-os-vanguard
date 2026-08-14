import { logger } from '@/lib/logger';
import { db } from '@/lib/offline/offline-store';
import { NexusEventBus, type NexusEventName } from '@orchestration/NexusEventBus';
import { PayloadMigrator } from '@orchestration/PayloadMigrator';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { JsonObject } from "@/lib/types/json";

/**
 * Rejoue les événements bloqués dans l'Outbox côté serveur (Firestore).
 * À appeler au démarrage du process Node, typiquement dans `instrumentation.ts`.
 * Ne fait rien si window est défini (= côté client, utiliser replayPendingEvents()).
 */
export async function replayPendingServerEvents(): Promise<void> {
  if (typeof window !== 'undefined') return;
  try {
    const pending = (await Nexus.adapter.query('busOutbox', {
      where: [{ field: 'status', operator: '==', value: 'pending' }],
    })) as Array<{ id: string; eventName: string; payload: JsonObject; attempts?: number }>;

    if (pending.length === 0) return;

    logger.info(`[NexusSyncService] Replay serveur : ${pending.length} event(s) en attente dans busOutbox Firestore…`);

    for (const entry of pending) {
      try {
        const migratedPayload = PayloadMigrator.migrate(entry.eventName as NexusEventName, entry.payload);
        await NexusEventBus.emit(entry.eventName as NexusEventName, migratedPayload);
        await Nexus.adapter.update(`busOutbox/${entry.id}`, { status: 'done' });
      } catch (err) {
        logger.error(`[NexusSyncService] Replay serveur échoué pour ${entry.eventName}`, err);
        await Nexus.adapter.update(`busOutbox/${entry.id}`, {
          attempts: (entry.attempts ?? 0) + 1,
          lastError: err instanceof Error ? err.message : String(err),
        }).catch(() => {});
      }
    }
  } catch (err) {
    logger.error('[NexusSyncService] Impossible de relire busOutbox côté serveur', err);
  }
}

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
