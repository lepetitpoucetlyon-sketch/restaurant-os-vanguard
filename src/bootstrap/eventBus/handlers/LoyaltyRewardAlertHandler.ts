import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerLoyaltyRewardAlertHandler() {
  return NexusEventBus.on(
    'crm.reward_unlocked',
    async (payload) => {
      const { tenantId, customerId, rewardId, rewardName } = payload;
      
      logger.info(`[CRM] Récompense '${rewardName}' débloquée pour le client ${customerId}`);
      
      empireAudit.log({
        module: 'crm',
        action: 'REWARD_UNLOCKED_ALERT',
        details: { customerId, rewardId, rewardName },
        severity: 'low',
        timestamp: new Date(),
      });
      
      // On notifie la salle pour qu'ils puissent offrir la récompense en direct
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId,
        id: `reward-alert-${customerId}-${Date.now()}`,
        type: 'info',
        title: 'Cadeau Fidélité !',
        message: `Le client ${customerId} vient de débloquer : ${rewardName}.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
      });
    },
    { id: 'loyalty-reward-alert-handler', priority: 'BACKGROUND' }
  );
}
