import { NexusEventBus } from '@orchestration/NexusEventBus';

export const RestaurantCommerceAdapter = {
  emitReservationConfirmed(payload: { tenantId: string; reservationId: string; customerName: string; covers: number; date: string; time: string }) {
    NexusEventBus.emitDurable('reservation.confirmed', { v: 1 as const, ...payload });
  },
  emitNoShow(payload: { tenantId: string; reservationId: string; customerId?: string }) {
    NexusEventBus.emitDurable('reservation.no_show', { v: 1 as const, ...payload });
  },
  emitLoyaltyPointsEarned(payload: { tenantId: string; customerId: string; points: number; sourceOrderId: string }) {
    NexusEventBus.emit('crm.points_earned', { v: 1 as const, ...payload });
  },
  emitCustomerRFMTrigger(payload: { tenantId: string; customerId: string }) {
    NexusEventBus.emitDurable('crm.rfm_trigger', payload);
  },
};
