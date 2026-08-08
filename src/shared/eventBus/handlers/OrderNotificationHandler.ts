import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * OrderNotificationHandler (P0-1.9)
 * Écoute `ops.order_notification`.
 * Notifie les serveurs et chefs de rang (WebPush / Notification UI) lorsqu'une mise à jour de commande a lieu.
 */
export function registerOrderNotificationHandler(): () => void {
  return NexusEventBus.on(
    'ops.order_notification',
    async (payload) => {
      const { tenantId, orderId, tableId, totalInMicrounits } = payload;
      const totalEuros = (totalInMicrounits / 1_000_000).toFixed(2);
      const tableInfo = tableId ? ` (Table ${tableId})` : '';

      try {
        logger.info(`[OrderNotificationHandler] Notification commande ${orderId}${tableInfo} (${totalEuros}€)`);

        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Commande ${orderId}${tableInfo} mise à jour (${totalEuros}€).`,
          roles: ['chef_rang', 'serveur'],
          priority: 'HIGH',
          metadata: { orderId, tableId, totalInMicrounits },
        });
      } catch (err) {
        logger.error(`[OrderNotificationHandler] Échec notification commande ${orderId}`, toError(err).message);
      }
    },
    { id: 'order-notification-handler', priority: 'HIGH' }
  );
}
