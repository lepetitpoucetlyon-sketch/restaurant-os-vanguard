import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeIntelligenceAdapter } from '@/verticals/_shared/adapters';

/** Intelligence clinique = socle universel (anomalies) + delta flux patients. */
export const HealthIntelligenceAdapter = {
  ...makeIntelligenceAdapter(),
  emitPatientFlowSnapshot(payload: { tenantId: string; date: string; admissions: number; discharges: number; occupancyRate: number }) {
    NexusEventBus.emit('health.patient_flow_snapshot', payload);
  },
};
