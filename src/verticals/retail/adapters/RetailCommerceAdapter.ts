import { NexusEventBus } from '@orchestration/NexusEventBus';

export const RetailCommerceAdapter = {
  emitPromotionActivated(payload: { tenantId: string; promotionId: string; discountPercent: number; productIds: string[]; validUntil: string }) {
    NexusEventBus.emit('retail.promotion_activated', payload);
  },
  emitLoyaltyEarned(payload: { tenantId: string; customerId: string; points: number; sourceSaleId: string }) {
    NexusEventBus.emit('retail.loyalty_earned', payload);
  },
  emitRFMTrigger(payload: { tenantId: string; customerId: string }) {
    NexusEventBus.emitDurable('crm.rfm_trigger', payload);
  },
};
