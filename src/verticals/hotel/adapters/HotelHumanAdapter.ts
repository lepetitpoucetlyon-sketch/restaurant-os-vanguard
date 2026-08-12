import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HotelHumanAdapter = {
  emitHousekeeperAssigned(payload: { tenantId: string; employeeId: string; taskId: string; roomId: string }) {
    NexusEventBus.emit('hotel.housekeeper_assigned', payload);
  },
};
