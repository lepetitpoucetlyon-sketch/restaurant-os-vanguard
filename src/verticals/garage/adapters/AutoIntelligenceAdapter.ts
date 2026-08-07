import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const AutoIntelligenceAdapter = {
  emitWorkshopMetricsSnapshot(payload: { tenantId: string; date: string; workOrdersCompleted: number; avgRepairTimeMinutes: number; revenueInMicrounits: number }) {
    NexusEventBus.emit('auto.workshop_metrics_snapshot', payload);
  },
};
