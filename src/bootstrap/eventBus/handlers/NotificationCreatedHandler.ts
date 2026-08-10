import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * NotificationCreatedHandler (P0-1.2)
 * Écoute `notification.created`.
 * Persiste la notification dans `tenants/{tenantId}/notifications/{id}` pour alimenter le centre de notifications UI.
 */
export function registerNotificationCreatedHandler(): () => void {
  return NexusEventBus.on(
    'notification.created',
    async (payload) => {
      const { tenantId, id, type, title, message, priority, read, timestamp } = payload;
      
      try {
        await Nexus.adapter.set(`tenants/${tenantId}/notifications/${id}`, {
          id,
          type,
          title,
          message,
          priority,
          read: read ?? false,
          timestamp: timestamp ?? new Date().toISOString(),
        });
        logger.info(`[NotificationCreatedHandler] Notification persistant enregistrée: ${title} (${id})`);
      } catch (err) {
        logger.error(`[NotificationCreatedHandler] Échec persistance notification ${id}`, toError(err).message);
        throw err;
      }
    },
    { id: 'notification-created-handler', priority: 'HIGH' }
  );
}
