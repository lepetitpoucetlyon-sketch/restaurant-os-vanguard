import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeCommerceAdapter } from '@/verticals/_shared/adapters';

/** Commerce boulangerie = socle universel (RFM) + deltas précommande & fidélité. */
export const BakeryCommerceAdapter = {
  ...makeCommerceAdapter(),
  emitPreorderReceived(payload: { tenantId: string; preorderId: string; customerId: string; items: { productId: string; quantity: number }[]; pickupDate: string }) {
    NexusEventBus.emitDurable('bakery.preorder_received', payload);
  },
  emitLoyaltyPointsEarned(payload: { tenantId: string; customerId: string; points: number; sourceOrderId: string }) {
    NexusEventBus.emit('crm.points_earned', { v: 1 as const, ...payload });
  },
};
