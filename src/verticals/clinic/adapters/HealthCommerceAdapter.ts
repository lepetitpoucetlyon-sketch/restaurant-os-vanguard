import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const HealthCommerceAdapter = {
  emitAppointmentBooked(payload: { tenantId: string; appointmentId: string; patientId: string; practitionerId: string; slot: string }) {
    NexusEventBus.emitDurable('health.appointment_booked', payload);
  },
  emitAppointmentCancelled(payload: { tenantId: string; appointmentId: string; reason: string }) {
    NexusEventBus.emitDurable('health.appointment_cancelled', payload);
  },
};
