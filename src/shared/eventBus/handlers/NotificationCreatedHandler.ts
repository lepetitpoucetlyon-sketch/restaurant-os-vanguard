import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

interface PersistedNotificationDoc {
  occurrences?: number;
  firstSeenAt?: string;
}

/**
 * NotificationCreatedHandler (P0-1.2)
 * Écoute `notification.created`.
 * Persiste la notification dans `tenants/{tenantId}/notifications/{id}` pour
 * alimenter le centre de notifications UI (hydraté par NotificationProvider).
 *
 * Correctif N0-5 — déduplication déterministe : si une notification portant le
 * même `id` (signal + sujet) existe déjà, on incrémente son compteur
 * `occurrences` et on la refait remonter (`read: false`) au lieu d'en créer une
 * seconde. Une alerte, une ligne.
 */
export function registerNotificationCreatedHandler(): () => void {
  return NexusEventBus.on(
    'notification.created',
    async (payload) => {
      const { tenantId, id, type, title, message, priority, read, timestamp, action } = payload;
      const path = `tenants/${tenantId}/notifications/${id}`;
      const now = timestamp ?? new Date().toISOString();

      try {
        const existing = await Nexus.adapter.get<PersistedNotificationDoc>(path);

        if (existing) {
          // Occurrence supplémentaire d'une condition déjà signalée → on agrège.
          await Nexus.adapter.update(path, {
            occurrences: (existing.occurrences ?? 1) + 1,
            lastSeenAt: now,
            read: false,        // une condition toujours vraie refait surface
            title,
            message,
            priority,
            updatedAt: now,
          });
          logger.info(`[NotificationCreatedHandler] Notification agrégée: ${title} (${id}) — occurrence ${(existing.occurrences ?? 1) + 1}`);
          return;
        }

        await Nexus.adapter.set(path, {
          id,
          type,
          title,
          message,
          priority,
          read: read ?? false,
          timestamp: now,
          firstSeenAt: now,
          lastSeenAt: now,
          occurrences: 1,
          ...(action ? { action } : {}),
        });
        logger.info(`[NotificationCreatedHandler] Notification persistante enregistrée: ${title} (${id})`);
      } catch (err) {
        logger.error(`[NotificationCreatedHandler] Échec persistance notification ${id}`, toError(err).message);
        throw err;
      }
    },
    { id: 'notification-created-handler', priority: 'HIGH' }
  );
}
