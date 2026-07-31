import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerLoyaltyEngineHandler() {
  const handleWalletEvent = async (tenantId: string, customerId: string, diff: number, eventType: string) => {
    const walletPath = `tenants/${tenantId}/wallets/${customerId}`;
    
    await Nexus.adapter.runTransaction(async (tx) => {
      const wallet = await Nexus.adapter.get<any>(walletPath) || { pointsBalance: 0 };
      const newBalance = Math.max(0, wallet.pointsBalance + diff);
      
      await Nexus.adapter.set(walletPath, {
        pointsBalance: newBalance,
        updatedAt: Date.now()
      });
      
      logger.info(`[LoyaltyEngine] Wallet ${customerId} mis à jour. Solde actuel: ${newBalance} pts.`);
      
      empireAudit.log({
        module: 'crm',
        action: 'LOYALTY_WALLET_UPDATED',
        details: { customerId, diff, newBalance, eventType },
        severity: 'low',
        timestamp: new Date(),
      });
    });
  };

  const unsubEarned = NexusEventBus.on(
    'crm.points_earned',
    (payload) => handleWalletEvent(payload.tenantId, payload.customerId, payload.points, 'points_earned'),
    { id: 'loyalty-earned', priority: 'HIGH' }
  );

  const unsubRedeemed = NexusEventBus.on(
    'crm.reward_redeemed',
    (payload) => handleWalletEvent(payload.tenantId, payload.customerId, -payload.pointsCost, 'reward_redeemed'),
    { id: 'loyalty-redeemed', priority: 'HIGH' }
  );

  return () => {
    unsubEarned();
    unsubRedeemed();
  };
}
