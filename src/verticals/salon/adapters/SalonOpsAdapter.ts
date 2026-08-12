import { NexusEventBus } from '@orchestration/NexusEventBus';

export const SalonOpsAdapter = {
  emitAppointmentCompleted(payload: { tenantId: string; appointmentId: string; customerId: string; stylistId: string; durationMinutes: number; totalInMicrounits: number }) {
    NexusEventBus.emitDurable('salon.appointment_completed', payload);
  },
  emitNoShow(payload: { tenantId: string; appointmentId: string; customerId: string; stylistId: string }) {
    NexusEventBus.emitDurable('salon.no_show', payload);
  },
};
