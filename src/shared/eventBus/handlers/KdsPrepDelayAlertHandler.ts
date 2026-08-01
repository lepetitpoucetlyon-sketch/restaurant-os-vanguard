import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerKdsPrepDelayAlertHandler() {
  return NexusEventBus.on(
    'kds.ticket_delayed',
    async (payload) => {
      const { tenantId, orderId, delayInMinutes } = payload;
      
      logger.warn(`[KDS] Retard détecté en cuisine pour la commande ${orderId} (${delayInMinutes} min)`);
      
      empireAudit.log({
        module: 'ops',
        action: 'KDS_TICKET_DELAYED',
        details: { orderId, delayInMinutes },
        severity: delayInMinutes > 15 ? 'high' : 'medium',
        timestamp: new Date(),
      });
      
      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId,
        message: `ALERTE CUISINE: La commande ${orderId} est en retard de ${delayInMinutes} minutes.`,
        roles: ['manager', 'kitchen_chef'],
        priority: 'HIGH',
      });
    },
    { id: 'kds-prep-delay-alert-handler', priority: 'HIGH' }
  );
}
