import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const SalonLogisticsAdapter = {
  emitProductConsumed(payload: { tenantId: string; productId: string; quantity: number; appointmentId: string }) {
    NexusEventBus.emit('salon.product_consumed', payload);
  },
  emitStockAlert(payload: { tenantId: string; productId: string; currentStock: number; threshold: number }) {
    NexusEventBus.emitDurable('retail.stock_alert', { tenantId: payload.tenantId, productId: payload.productId, sku: payload.productId, currentStock: payload.currentStock, threshold: payload.threshold });
  },
};
