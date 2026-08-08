import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';
import { toError } from "@/lib/toError";

/**
 * NotificationUrgentDispatchHandler (P0-1.2)
 * Écoute `notification.urgent` (priority: CRITICAL).
 * Dispatche l'alerte WebPush vers tous les rôles cibles spécifiés dans `payload.roles`.
 */
export function registerNotificationUrgentDispatchHandler(): () => void {
  return NexusEventBus.on(
    'notification.urgent',
    async (payload) => {
      const { tenantId, message, roles, metadata } = payload;
      logger.info(`[NotificationUrgentDispatch] Dispatch alerte push pour rôles [${roles.join(', ')}] (tenant: ${tenantId})`);

      for (const role of roles) {
        try {
          if (typeof window !== 'undefined') {
            await browserPush.sendToRole(tenantId, role, {
              title: 'Alerte Urgente',
              body: message,
            });
          } else {
            // Context SSR / API route: fetch interne vers l'API push
            await fetch('/api/push/internal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId,
                role,
                title: 'Alerte Urgente',
                body: message,
                metadata,
              }),
            }).catch(e => logger.warn(`[NotificationUrgentDispatch] WebPush API fetch failed for role ${role}`, toError(e).message));
          }
        } catch (err) {
          logger.warn(`[NotificationUrgentDispatch] Échec émission WebPush pour rôle ${role}: ${toError(err).message}`);
        }
      }
    },
    { id: 'notification-urgent-dispatch-handler', priority: 'CRITICAL' }
  );
}
