import { NexusEventBus } from '@orchestration/NexusEventBus';

export const BakeryOpsAdapter = {
  emitBatchStarted(payload: { tenantId: string; batchId: string; recipe: string; quantity: number; ovenId: string; startedAt: string }) {
    NexusEventBus.emitDurable('bakery.batch_started', payload);
  },
  emitBatchCompleted(payload: { tenantId: string; batchId: string; recipe: string; yield: number; completedAt: string }) {
    NexusEventBus.emitDurable('bakery.batch_completed', payload);
  },
  emitOvenTempAlert(payload: { tenantId: string; ovenId: string; currentTemp: number; targetTemp: number; severity: 'warning' | 'critical' }) {
    NexusEventBus.emitDurable('bakery.oven_temp_alert', payload);
  },
};
