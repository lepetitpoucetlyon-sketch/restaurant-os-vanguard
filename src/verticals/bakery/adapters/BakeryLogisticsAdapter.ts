import { NexusEventBus } from '@orchestration/NexusEventBus';

export const BakeryLogisticsAdapter = {
  emitIngredientConsumed(payload: { tenantId: string; batchId: string; lines: { ingredientId: string; quantity: number }[] }) {
    NexusEventBus.emit('bakery.ingredient_consumed', payload);
  },
  emitWasteLogged(payload: { tenantId: string; batchId: string; productId: string; quantity: number; reason: string }) {
    NexusEventBus.emitDurable('bakery.waste_logged', payload);
  },
  emitDisplayStockLow(payload: { tenantId: string; productId: string; currentStock: number; threshold: number }) {
    NexusEventBus.emitDurable('bakery.display_stock_low', payload);
  },
};
