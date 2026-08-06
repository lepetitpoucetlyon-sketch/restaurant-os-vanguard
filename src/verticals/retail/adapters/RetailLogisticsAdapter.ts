import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const RetailLogisticsAdapter = {
  emitStockDeducted(payload: { tenantId: string; orderId: string; lines: { stockItemId: string; quantity: number }[] }) {
    NexusEventBus.emit('inventory.deducted', payload);
  },
  emitStockAlert(payload: { tenantId: string; productId: string; sku: string; currentStock: number; threshold: number }) {
    NexusEventBus.emitDurable('retail.stock_alert', payload);
  },
  emitReturnRestocked(payload: { tenantId: string; wasteId: string; items: { productId: string; quantity: number }[] }) {
    NexusEventBus.emitDurable('inventory.waste_logged', { v: 1 as const, ...payload });
  },
};
