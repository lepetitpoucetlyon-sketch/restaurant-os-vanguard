import { NexusEventBus } from '@orchestration/NexusEventBus';

export const RestaurantLogisticsAdapter = {
  emitStockDeducted(payload: { tenantId: string; orderId: string; lines: { stockItemId: string; quantity: number }[] }) {
    NexusEventBus.emit('inventory.deducted', payload);
  },
  emitDlcExpiry(payload: { tenantId: string; itemId: string; quantity: number; batchNumber: string }) {
    NexusEventBus.emitDurable('dlc.expired', { v: 1 as const, ...payload });
  },
  emitWasteLogged(payload: { tenantId: string; wasteId: string; items: { productId: string; quantity: number }[] }) {
    NexusEventBus.emitDurable('inventory.waste_logged', { v: 1 as const, ...payload });
  },
};
