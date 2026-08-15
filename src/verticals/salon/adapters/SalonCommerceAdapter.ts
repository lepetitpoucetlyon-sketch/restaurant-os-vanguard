import { NexusEventBus, type NexusEventPayload } from '@/shared/eventBus/NexusEventBus';
import { makeCommerceAdapter } from '@/verticals/_shared/adapters';

/** Commerce salon = socle universel (RFM CRM) + deltas RDV/fidélité propres au salon. */
export const SalonCommerceAdapter = {
  ...makeCommerceAdapter(),
  emitAppointmentBooked(p: NexusEventPayload<'salon.appointment_booked'>) {
    NexusEventBus.emitDurable('salon.appointment_booked', p);
  },
  emitAppointmentCancelled(p: NexusEventPayload<'salon.appointment_cancelled'>) {
    NexusEventBus.emitDurable('salon.appointment_cancelled', p);
  },
  emitLoyaltyEarned(p: NexusEventPayload<'salon.loyalty_earned'>) {
    NexusEventBus.emit('salon.loyalty_earned', p);
  },
};
