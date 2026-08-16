import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeIntelligenceAdapter } from '@/verticals/_shared/adapters';

/** Intelligence garage = socle universel (anomalies) + delta métriques atelier. */
export const AutoIntelligenceAdapter = {
  ...makeIntelligenceAdapter(),
  emitWorkshopMetricsSnapshot(payload: { tenantId: string; date: string; workOrdersCompleted: number; avgRepairTimeMinutes: number; revenueInMicrounits: number }) {
    NexusEventBus.emit('auto.workshop_metrics_snapshot', payload);
  },
};
