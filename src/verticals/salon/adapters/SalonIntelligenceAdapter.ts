import { NexusEventBus, type NexusEventPayload } from '@/shared/eventBus/NexusEventBus';
import { makeIntelligenceAdapter } from '@/verticals/_shared/adapters';

/** Intelligence salon = socle universel (anomalies) + delta métriques fauteuils. */
export const SalonIntelligenceAdapter = {
  ...makeIntelligenceAdapter(),
  emitChairMetricsSnapshot(p: NexusEventPayload<'salon.chair_metrics_snapshot'>) {
    NexusEventBus.emit('salon.chair_metrics_snapshot', p);
  },
};
