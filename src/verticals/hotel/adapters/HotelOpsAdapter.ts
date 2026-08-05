import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const HotelOpsAdapter = {
  emitCheckIn(payload: { tenantId: string; reservationId: string; guestId: string; roomId: string; checkedInAt: string }) {
    NexusEventBus.emitDurable('hotel.guest_checked_in', payload);
  },
  emitCheckOut(payload: { tenantId: string; reservationId: string; guestId: string; roomId: string; totalInMicrounits: number }) {
    NexusEventBus.emitDurable('hotel.guest_checked_out', payload);
  },
  emitRoomStatusChanged(payload: { tenantId: string; roomId: string; status: 'CLEAN' | 'DIRTY' | 'MAINTENANCE' }) {
    NexusEventBus.emit('hotel.room_status_changed', payload);
  },
  emitHousekeepingTaskCreated(payload: { tenantId: string; taskId: string; roomId: string; assignedTo?: string }) {
    NexusEventBus.emit('hotel.housekeeping_task_created', payload);
  },
};
