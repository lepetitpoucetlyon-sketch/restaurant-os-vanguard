import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const RestaurantIntelligenceAdapter = {
  emitSalesDataReady(payload: { tenantId: string; periodStart: string; periodEnd: string; totalInMicrounits: number; covers: number }) {
    NexusEventBus.emit('analytics.sales_data_ready', payload);
  },
  emitAnomalyDetected(payload: { tenantId: string; metric: string; value: number; threshold: number; detectedAt: string }) {
    NexusEventBus.emitDurable('analytics.anomaly_detected', payload);
  },
  emitMenuEngineeringRequest(payload: { tenantId: string; periodDays: number }) {
    NexusEventBus.emit('intelligence.menu_engineering_requested', payload);
  },
};
