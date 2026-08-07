import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const AutoLogisticsAdapter = {
  emitPartConsumed(payload: { tenantId: string; partId: string; workOrderId: string; quantity: number }) {
    NexusEventBus.emit('auto.part_consumed', payload);
  },
  emitPartReorderNeeded(payload: { tenantId: string; partId: string; partNumber: string; currentStock: number; reorderQty: number }) {
    NexusEventBus.emitDurable('auto.part_reorder_needed', payload);
  },
};
