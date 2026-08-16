import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeIntelligenceAdapter } from '@/verticals/_shared/adapters';

/** Intelligence retail = socle universel (anomalies) + delta métriques ventes. */
export const RetailIntelligenceAdapter = {
  ...makeIntelligenceAdapter(),
  emitMetricsSnapshot(payload: { tenantId: string; date: string; transactions: number; revenueInMicrounits: number; avgBasketInMicrounits: number }) {
    NexusEventBus.emit('retail.metrics_snapshot', payload);
  },
};
