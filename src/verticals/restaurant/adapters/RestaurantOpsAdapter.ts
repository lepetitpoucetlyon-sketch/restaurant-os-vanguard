import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const RestaurantOpsAdapter = {
  emitOrderPlaced(payload: { tenantId: string; orderId: string; tableId?: string; totalInMicrounits: number }) {
    NexusEventBus.emitDurable('ops.order_notification', payload);
  },
  emitTableReleased(payload: { tenantId: string; tableId: string }) {
    NexusEventBus.emit('table.released', { v: 1 as const, tenantId: payload.tenantId, tableId: payload.tableId });
  },
  emitKdsPassthrough(payload: { tenantId: string; orderId: string; courseId: string }) {
    NexusEventBus.emit('kds.course_passed', payload);
  },
};
