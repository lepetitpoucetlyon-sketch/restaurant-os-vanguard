import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeIntelligenceAdapter } from '@/verticals/_shared/adapters';

/** Intelligence boulangerie = socle universel (anomalies) + delta métriques fournées. */
export const BakeryIntelligenceAdapter = {
  ...makeIntelligenceAdapter(),
  emitMetricsSnapshot(payload: { tenantId: string; date: string; batchesProduced: number; wastePercent: number; revenueInMicrounits: number }) {
    NexusEventBus.emit('bakery.metrics_snapshot', payload);
  },
};
