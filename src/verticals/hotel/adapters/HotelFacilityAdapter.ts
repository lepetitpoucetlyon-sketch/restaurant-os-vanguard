import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFacilityAdapter } from '@/verticals/_shared/adapters';

/** Facility hôtel = socle universel + delta maintenance chambre. */
export const HotelFacilityAdapter = {
  ...makeFacilityAdapter(),
  emitRoomMaintenanceRequired(payload: { tenantId: string; roomId: string; issue: string; priority: 'low' | 'medium' | 'high' }) {
    NexusEventBus.emitDurable('hotel.room_maintenance_required', payload);
  },
};
