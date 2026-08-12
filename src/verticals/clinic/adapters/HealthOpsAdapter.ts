import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HealthOpsAdapter = {
  emitPatientAdmitted(payload: { tenantId: string; patientId: string; wardId: string; admittedAt: string; pathology?: string }) {
    NexusEventBus.emitDurable('health.patient_admitted', payload);
  },
  emitPatientDischarged(payload: { tenantId: string; patientId: string; wardId: string; dischargedAt: string }) {
    NexusEventBus.emitDurable('health.patient_discharged', payload);
  },
  emitBedStatusChanged(payload: { tenantId: string; bedId: string; wardId: string; status: 'available' | 'occupied' | 'cleaning' | 'maintenance' }) {
    NexusEventBus.emit('health.bed_status_changed', payload);
  },
};
