import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * LoyaltyNotificationHandler (P2-5.3)
 * Écoute `crm.points_earned`.
 * Notifie le client (email/push UI) de l'accumulation de ses points de fidélité.
 */
export function registerLoyaltyNotificationHandler(): () => void {
  return NexusEventBus.on(
    'crm.points_earned',
    async (payload) => {
      const { tenantId, customerId, points } = payload;

      try {
        const customer = await Nexus.adapter.get<{ firstName?: string; email?: string }>(`tenants/${tenantId}/crms/${customerId}`);
        if (!customer) return;

        logger.info(`[LoyaltyNotificationHandler] Notification fidélité pour ${customerId} (+${points} pts)`);

        await NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId,
          id: `loyalty-${customerId}-${Date.now()}`,
          type: 'info',
          title: 'Points Fidélité Gagnés !',
          message: `Félicitations ${customer.firstName || 'Cher Client'}, vous avez accumulé ${points} point(s) de fidélité lors de votre dernier passage !`,
          priority: 'low',
          read: false,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        logger.error(`[LoyaltyNotificationHandler] Échec notification fidélité pour ${customerId}`, toError(err).message);
      }
    },
    { id: 'loyalty-notification-handler', priority: 'BACKGROUND' }
  );
}
