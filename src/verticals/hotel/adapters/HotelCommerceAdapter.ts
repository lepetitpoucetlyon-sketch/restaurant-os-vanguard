import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HotelCommerceAdapter = {
  emitRoomBooked(payload: { tenantId: string; reservationId: string; guestId: string; roomType: string; channel: string; arrivalDate: string; departureDate: string; rateInMicrounits: number }) {
    NexusEventBus.emitDurable('hotel.room_booked', payload);
  },
  emitYieldRateUpdated(payload: { tenantId: string; roomType: string; date: string; newRateInMicrounits: number }) {
    NexusEventBus.emit('hotel.yield_rate_updated', payload);
  },
};
