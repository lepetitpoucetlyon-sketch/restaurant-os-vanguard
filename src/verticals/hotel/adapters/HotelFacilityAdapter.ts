import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HotelFacilityAdapter = {
  emitRoomMaintenanceRequired(payload: { tenantId: string; roomId: string; issue: string; priority: 'low' | 'medium' | 'high' }) {
    NexusEventBus.emitDurable('hotel.room_maintenance_required', payload);
  },
};
