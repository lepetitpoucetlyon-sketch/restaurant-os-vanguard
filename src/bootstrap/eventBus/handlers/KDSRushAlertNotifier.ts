import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * KDSRushAlertNotifier (P1-4.4)
 * Écoute `kds.rush_alert`.
 * Notifie le manager et le chef cuisinier lorsqu'un retard de préparation KDS critique est détecté.
 */
export function registerKDSRushAlertNotifier(): () => void {
  return NexusEventBus.on(
    'kds.rush_alert',
    async (payload) => {
      const { tenantId, orderId, exceededByMinutes } = payload;

      try {
        logger.warn(`[KDSRushAlertNotifier] Alerte Rush KDS pour commande ${orderId} (retard: ${exceededByMinutes} min)`);

        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Alerte Rush Cuisine : Commande ${orderId} en retard (${exceededByMinutes} min). Renfort recommandé.`,
          roles: ['manager', 'chef_cuisinier'],
          priority: 'CRITICAL',
          metadata: { orderId, exceededByMinutes },
        });
      } catch (err) {
        logger.error(`[KDSRushAlertNotifier] Échec alerte rush KDS`, toError(err).message);
        throw err; // Alerte critique cuisine → DLQ pour retry
      }
    },
    { id: 'kds-rush-alert-notifier', priority: 'CRITICAL' }
  );
}
