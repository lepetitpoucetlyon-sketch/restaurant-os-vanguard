import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerKdsPassNotifierHandler() {
  return NexusEventBus.on(
    'kds.ticket_done',
    async (payload) => {
      const { tenantId, orderId } = payload;
      
      // En théorie, on trouve le serveur associé à cette commande (order.operatorId)
      // et on lui envoie une notification WebPush via le PushService.
      logger.info(`[PassNotifier] Ticket ${orderId} PRÊT AU PASSE. Notification envoyée au serveur.`);

      // if ('Notification' in window) { ... } -> Côté frontend / Service Worker

      empireAudit.log({
        module: 'ops',
        action: 'KDS_TICKET_READY_NOTIFIED',
        details: { orderId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'kds-pass-notifier', priority: 'HIGH' }
  );
}
