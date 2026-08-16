import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeHumanAdapter } from '@/verticals/_shared/adapters';

/** RH hôtel = socle universel (shift/heures sup) + delta affectation gouvernante. */
export const HotelHumanAdapter = {
  ...makeHumanAdapter(),
  emitHousekeeperAssigned(payload: { tenantId: string; employeeId: string; taskId: string; roomId: string }) {
    NexusEventBus.emit('hotel.housekeeper_assigned', payload);
  },
};
