import { NexusEventBus, type NexusEventPayload } from '@/shared/eventBus/NexusEventBus';
import { makeHumanAdapter } from '@/verticals/_shared/adapters';

/** RH salon = socle universel (shift + heures sup) + delta assignation styliste. */
export const SalonHumanAdapter = {
  ...makeHumanAdapter(),
  emitStylistAssigned(p: NexusEventPayload<'salon.stylist_assigned'>) {
    NexusEventBus.emit('salon.stylist_assigned', p);
  },
};
