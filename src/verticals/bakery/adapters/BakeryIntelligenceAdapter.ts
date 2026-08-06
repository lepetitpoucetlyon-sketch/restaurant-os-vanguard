import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const BakeryIntelligenceAdapter = {
  emitMetricsSnapshot(payload: { tenantId: string; date: string; batchesProduced: number; wastePercent: number; revenueInMicrounits: number }) {
    NexusEventBus.emit('bakery.metrics_snapshot', payload);
  },
  emitAnomalyDetected(payload: { tenantId: string; metric: string; value: number; threshold: number; detectedAt: string }) {
    NexusEventBus.emitDurable('analytics.anomaly_detected', payload);
  },
};
