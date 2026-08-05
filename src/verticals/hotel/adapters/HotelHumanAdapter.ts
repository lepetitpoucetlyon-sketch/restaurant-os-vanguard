import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const HotelHumanAdapter = {
  emitHousekeeperAssigned(payload: { tenantId: string; employeeId: string; taskId: string; roomId: string }) {
    NexusEventBus.emit('hotel.housekeeper_assigned', payload);
  },
};
