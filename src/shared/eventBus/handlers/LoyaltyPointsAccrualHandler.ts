import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

interface CustomerProfile {
  loyaltyPoints?: number;
  totalSpentInMicrounits?: number;
}

export function registerLoyaltyPointsAccrualHandler() {
  return NexusEventBus.on(
    'order.paid',
    async (payload) => {
      const { tenantId, orderId, customerId, totalInMicrounits } = payload;
      if (!customerId || totalInMicrounits <= 0) return;

      const profilePath = `tenants/${tenantId}/crms/${customerId}`;
      const profile = await Nexus.adapter.get<CustomerProfile>(profilePath);
      if (!profile) return;

      // Règle: 1 point pour chaque 1€ dépensé
      const pointsEarned = Math.floor(totalInMicrounits / 100000);
      const newPoints = (profile.loyaltyPoints ?? 0) + pointsEarned;
      const newTotalSpent = (profile.totalSpentInMicrounits ?? 0) + totalInMicrounits;
      
      await Nexus.adapter.update(profilePath, {
        loyaltyPoints: newPoints,
        totalSpentInMicrounits: newTotalSpent,
        updatedAt: new Date().toISOString(),
      });
      
      logger.info(`[CRM] Le client ${customerId} a gagné ${pointsEarned} points (Solde: ${newPoints}).`);
      
      empireAudit.log({
        module: 'crm',
        action: 'POINTS_EARNED',
        details: { customerId, pointsEarned, totalInMicrounits },
        severity: 'low',
        timestamp: new Date(),
      });
      
      // On déclenche l'événement points_earned
      Promise.resolve().then(() => {
        NexusEventBus.emitDurable('crm.points_earned', {
          v: 1,
          tenantId,
          customerId,
          points: pointsEarned,
          sourceOrderId: orderId,
        });
        
        // Simuler le déblocage d'une récompense si on atteint 100 points par exemple
        if (newPoints >= 100 && (profile.loyaltyPoints ?? 0) < 100) {
          NexusEventBus.emitDurable('crm.reward_unlocked', {
            v: 1,
            tenantId,
            customerId,
            rewardId: 'REWARD_DESSERT',
            rewardName: 'Dessert Offert',
          });
        }
      });
    },
    { id: 'loyalty-points-accrual-handler', priority: 'BACKGROUND' }
  );
}
