import { NexusEventBus } from '@orchestration/NexusEventBus';

export const SalonHumanAdapter = {
  emitStylistAssigned(payload: { tenantId: string; stylistId: string; appointmentId: string }) {
    NexusEventBus.emit('salon.stylist_assigned', payload);
  },
  emitShiftStarted(payload: { tenantId: string; shiftId: string; employeeId: string; role: string; startedAt: number }) {
    NexusEventBus.emit('hr.shift_started', { v: 1 as const, ...payload });
  },
  emitOvertimeAlert(payload: { tenantId: string; employeeId: string; extraMinutes: number }) {
    NexusEventBus.emitDurable('hr.overtime_alert', payload);
  },
};
