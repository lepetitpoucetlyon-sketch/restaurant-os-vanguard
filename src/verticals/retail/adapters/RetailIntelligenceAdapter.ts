import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const RetailIntelligenceAdapter = {
  emitMetricsSnapshot(payload: { tenantId: string; date: string; transactions: number; revenueInMicrounits: number; avgBasketInMicrounits: number }) {
    NexusEventBus.emit('retail.metrics_snapshot', payload);
  },
  emitAnomalyDetected(payload: { tenantId: string; metric: string; value: number; threshold: number; detectedAt: string }) {
    NexusEventBus.emitDurable('analytics.anomaly_detected', payload);
  },
};
