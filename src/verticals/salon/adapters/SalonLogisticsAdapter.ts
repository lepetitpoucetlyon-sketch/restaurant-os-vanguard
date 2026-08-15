import { NexusEventBus, type NexusEventPayload } from '@/shared/eventBus/NexusEventBus';
import { makeLogisticsAdapter } from '@/verticals/_shared/adapters';

/**
 * Logistique salon = socle universel + deltas.
 * emitStockAlert override le socle : mapping métier productId → sku (produit cabine
 * sans SKU distinct). C'est de la logique métier L2 assumée, pas du boilerplate.
 */
export const SalonLogisticsAdapter = {
  ...makeLogisticsAdapter(),
  emitProductConsumed(p: NexusEventPayload<'salon.product_consumed'>) {
    NexusEventBus.emit('salon.product_consumed', p);
  },
  emitStockAlert(payload: { tenantId: string; productId: string; currentStock: number; threshold: number }) {
    NexusEventBus.emitDurable('retail.stock_alert', {
      tenantId: payload.tenantId,
      productId: payload.productId,
      sku: payload.productId,
      currentStock: payload.currentStock,
      threshold: payload.threshold,
    });
  },
};
