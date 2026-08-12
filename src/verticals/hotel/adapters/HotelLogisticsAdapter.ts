import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HotelLogisticsAdapter = {
  emitAmenityConsumed(payload: { tenantId: string; roomId: string; itemId: string; quantity: number }) {
    NexusEventBus.emit('hotel.amenity_consumed', payload);
  },
};
