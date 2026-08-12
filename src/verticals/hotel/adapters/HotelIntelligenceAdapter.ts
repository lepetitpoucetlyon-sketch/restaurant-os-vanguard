import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HotelIntelligenceAdapter = {
  emitOccupancySnapshot(payload: { tenantId: string; date: string; occupancyRate: number; revpar: number }) {
    NexusEventBus.emit('hotel.occupancy_snapshot', payload);
  },
};
