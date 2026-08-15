import { NexusEventBus, type NexusEventPayload } from '@/shared/eventBus/NexusEventBus';

/** Ops salon = events propres au métier (pas de socle universel : pilier sans factory). */
export const SalonOpsAdapter = {
  emitAppointmentCompleted(p: NexusEventPayload<'salon.appointment_completed'>) {
    NexusEventBus.emitDurable('salon.appointment_completed', p);
  },
  emitNoShow(p: NexusEventPayload<'salon.no_show'>) {
    NexusEventBus.emitDurable('salon.no_show', p);
  },
};
