import { NexusEventBus } from '@orchestration/NexusEventBus';

export const SalonIntelligenceAdapter = {
  emitChairMetricsSnapshot(payload: { tenantId: string; date: string; totalAppointments: number; utilization: number; revenueInMicrounits: number }) {
    NexusEventBus.emit('salon.chair_metrics_snapshot', payload);
  },
  emitAnomalyDetected(payload: { tenantId: string; metric: string; value: number; threshold: number; detectedAt: string }) {
    NexusEventBus.emitDurable('analytics.anomaly_detected', payload);
  },
};
