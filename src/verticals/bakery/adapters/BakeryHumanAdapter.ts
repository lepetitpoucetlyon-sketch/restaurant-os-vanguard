import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const BakeryHumanAdapter = {
  emitShiftStarted(payload: { tenantId: string; shiftId: string; employeeId: string; role: string; startedAt: number }) {
    NexusEventBus.emit('hr.shift_started', { v: 1 as const, ...payload });
  },
  emitOvertimeAlert(payload: { tenantId: string; employeeId: string; extraMinutes: number }) {
    NexusEventBus.emitDurable('hr.overtime_alert', payload);
  },
};
