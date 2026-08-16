import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeIntelligenceAdapter } from '@/verticals/_shared/adapters';

/** Intelligence hôtel = socle universel (anomalies) + delta occupation/RevPAR. */
export const HotelIntelligenceAdapter = {
  ...makeIntelligenceAdapter(),
  emitOccupancySnapshot(payload: { tenantId: string; date: string; occupancyRate: number; revpar: number }) {
    NexusEventBus.emit('hotel.occupancy_snapshot', payload);
  },
};
