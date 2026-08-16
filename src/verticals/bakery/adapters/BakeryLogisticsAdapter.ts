import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeLogisticsAdapter } from '@/verticals/_shared/adapters';

/** Logistique boulangerie = socle universel (stock alert) + deltas ingrédients & invendus. */
export const BakeryLogisticsAdapter = {
  ...makeLogisticsAdapter(),
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
