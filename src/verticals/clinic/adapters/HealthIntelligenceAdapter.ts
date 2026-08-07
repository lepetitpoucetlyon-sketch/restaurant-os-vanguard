import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const HealthIntelligenceAdapter = {
  emitPatientFlowSnapshot(payload: { tenantId: string; date: string; admissions: number; discharges: number; occupancyRate: number }) {
    NexusEventBus.emit('health.patient_flow_snapshot', payload);
  },
};
