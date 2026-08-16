import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeCommerceAdapter } from '@/verticals/_shared/adapters';

/** Commerce retail = socle universel (RFM) + deltas promotions & fidélité. */
export const RetailCommerceAdapter = {
  ...makeCommerceAdapter(),
  emitPromotionActivated(payload: { tenantId: string; promotionId: string; discountPercent: number; productIds: string[]; validUntil: string }) {
    NexusEventBus.emit('retail.promotion_activated', payload);
  },
  emitLoyaltyEarned(payload: { tenantId: string; customerId: string; points: number; sourceSaleId: string }) {
    NexusEventBus.emit('retail.loyalty_earned', payload);
  },
};
