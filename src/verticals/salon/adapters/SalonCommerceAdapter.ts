import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const SalonCommerceAdapter = {
  emitAppointmentBooked(payload: { tenantId: string; appointmentId: string; customerId: string; stylistId: string; service: string; slot: string }) {
    NexusEventBus.emitDurable('salon.appointment_booked', payload);
  },
  emitAppointmentCancelled(payload: { tenantId: string; appointmentId: string; reason: string; customerId: string }) {
    NexusEventBus.emitDurable('salon.appointment_cancelled', payload);
  },
  emitLoyaltyEarned(payload: { tenantId: string; customerId: string; points: number; sourceAppointmentId: string }) {
    NexusEventBus.emit('salon.loyalty_earned', payload);
  },
  emitRFMTrigger(payload: { tenantId: string; customerId: string }) {
    NexusEventBus.emitDurable('crm.rfm_trigger', payload);
  },
};
