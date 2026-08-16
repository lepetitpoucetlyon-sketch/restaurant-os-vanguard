import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeLogisticsAdapter } from '@/verticals/_shared/adapters';

/** Logistique retail = socle universel (emitStockAlert) + deltas déduction & retour stock. */
export const RetailLogisticsAdapter = {
  ...makeLogisticsAdapter(),
  emitStockDeducted(payload: { tenantId: string; orderId: string; lines: { stockItemId: string; quantity: number }[] }) {
    NexusEventBus.emit('inventory.deducted', payload);
  },
  emitReturnRestocked(payload: { tenantId: string; wasteId: string; items: { productId: string; quantity: number }[] }) {
    NexusEventBus.emitDurable('inventory.waste_logged', { v: 1 as const, ...payload });
  },
};
