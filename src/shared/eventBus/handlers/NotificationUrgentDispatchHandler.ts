import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';
import { normalizeRbacRole } from '@/kernel/contracts/rbac';
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

      // Correctif N0-3 : normalisation canonique des rôles au point d'étranglement.
      // Corrige d'un seul endroit les 84 ciblages en dur non canoniques du dépôt
      // (ex. 'ADMIN', 'MANAGER', 'kitchen_chef') que sendToRole ne résout pas.
      // Normalisation insensible à la casse : couvre les variantes majuscules
      // ('ADMIN', 'MANAGER', 'CHEF_CUISINIER') et les alias legacy ('kitchen_chef').
      const normalizedRoles = Array.from(
        new Set(
          (roles ?? [])
            .map((r) => normalizeRbacRole(r) ?? normalizeRbacRole(String(r).toLowerCase()))
            .filter((r): r is NonNullable<typeof r> => r !== null)
            .map((r) => String(r))
        )
      );

      if (normalizedRoles.length === 0) {
        logger.warn(
          `[NotificationUrgentDispatch] Aucun rôle canonique résolu pour [${(roles ?? []).join(', ')}] (tenant: ${tenantId}) — alerte non dispatchée`
        );
        return;
      }

      logger.info(`[NotificationUrgentDispatch] Dispatch alerte push pour rôles [${normalizedRoles.join(', ')}] (tenant: ${tenantId})`);

      for (const role of normalizedRoles) {
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
