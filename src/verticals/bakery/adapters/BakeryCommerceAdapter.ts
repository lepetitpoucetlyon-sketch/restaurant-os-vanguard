import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const BakeryCommerceAdapter = {
  emitPreorderReceived(payload: { tenantId: string; preorderId: string; customerId: string; items: { productId: string; quantity: number }[]; pickupDate: string }) {
    NexusEventBus.emitDurable('bakery.preorder_received', payload);
  },
  emitLoyaltyPointsEarned(payload: { tenantId: string; customerId: string; points: number; sourceOrderId: string }) {
    NexusEventBus.emit('crm.points_earned', { v: 1 as const, ...payload });
  },
};
