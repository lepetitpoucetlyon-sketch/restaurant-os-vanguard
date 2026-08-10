import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * KDSTicketDoneNotifier (P1-4.2 & 5.2)
 * Notifie les serveurs et l'hôtesse lors de la fin de préparation KDS et de la libération d'une table.
 */
export function registerKDSTicketDoneNotifier(): () => void {
  const unsub1 = NexusEventBus.on(
    'kds.ticket_done',
    async (payload) => {
      const { tenantId, orderId } = payload;

      try {
        logger.info(`[KDSTicketDoneNotifier] Ticket KDS terminé pour commande ${orderId}`);

        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Commande ${orderId} prête au passe !`,
          roles: ['serveur', 'chef_rang'],
          priority: 'HIGH',
          metadata: { orderId },
        });
      } catch (err) {
        logger.error(`[KDSTicketDoneNotifier] Échec notification KDS ticket_done ${orderId}`, toError(err).message);
        throw err;
      }
    },
    { id: 'kds-ticket-done-notifier', priority: 'HIGH' }
  );

  const unsub2 = NexusEventBus.on(
    'table.released',
    async (payload) => {
      const { tenantId, tableId } = payload;

      try {
        logger.info(`[KDSTicketDoneNotifier] Table ${tableId} libérée (tenant: ${tenantId})`);

        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Table ${tableId} disponible pour placement.`,
          roles: ['hotesse', 'chef_rang'],
          priority: 'HIGH',
          metadata: { tableId },
        });
      } catch (err) {
        logger.error(`[KDSTicketDoneNotifier] Échec notification table.released ${tableId}`, toError(err).message);
      }
    },
    { id: 'table-released-notifier', priority: 'HIGH' }
  );

  return () => {
    unsub1();
    unsub2();
  };
}
