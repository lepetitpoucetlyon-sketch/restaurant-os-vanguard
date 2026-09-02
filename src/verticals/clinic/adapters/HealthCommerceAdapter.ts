import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeCommerceAdapter } from '@/verticals/_shared/adapters';

/** @wip vertical-forge — Échéance: 2026-11-01. Commerce clinique = socle universel (RFM) + deltas RDV patient. */
export const HealthCommerceAdapter = {
  ...makeCommerceAdapter(),
  emitAppointmentBooked(payload: { tenantId: string; appointmentId: string; patientId: string; practitionerId: string; slot: string }) {
    NexusEventBus.emitDurable('health.appointment_booked', payload);
  },
  emitAppointmentCancelled(payload: { tenantId: string; appointmentId: string; reason: string }) {
    NexusEventBus.emitDurable('health.appointment_cancelled', payload);
  },
};
