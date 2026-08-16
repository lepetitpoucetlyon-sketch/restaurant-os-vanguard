import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeLogisticsAdapter } from '@/verticals/_shared/adapters';

/** Logistique hôtel = socle universel (stock alert) + delta consommation amenities. */
export const HotelLogisticsAdapter = {
  ...makeLogisticsAdapter(),
  emitAmenityConsumed(payload: { tenantId: string; roomId: string; itemId: string; quantity: number }) {
    NexusEventBus.emit('hotel.amenity_consumed', payload);
  },
};
