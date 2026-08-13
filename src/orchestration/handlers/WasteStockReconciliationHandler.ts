import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

type StockItem = {
  quantity?: number;
  minQuantity?: number;
};

/**
 * WasteStockReconciliationHandler (P1)
 * Déduit automatiquement les stocks (au gramme) lorsqu'une perte (waste) est déclarée.
 * Maintient la synchro stricte entre le registre HACCP des pertes et le stock physique.
 */
export function registerWasteStockReconciliationHandler(): () => void {
  return NexusEventBus.on(
    'waste.logged',
    async (payload) => {
      const { tenantId, wasteId, ingredientId, ingredientName, quantity, reason } = payload;
      
      const path = `tenants/${tenantId}/stockItems/${ingredientId}`;
      const stockItem = await Nexus.adapter.get<StockItem>(path);
      
      if (!stockItem) {
        logger.warn(`[WasteStockHandler] Stock introuvable pour l'ingrédient perdu: ${ingredientId}`);
        return;
      }

      const newQty = Math.max(0, (stockItem.quantity ?? 0) - quantity);
      
      await Nexus.adapter.update(path, {
        quantity: newQty,
        updatedAt: new Date().toISOString(),
      });

      logger.info(`[WasteStockHandler] ${ingredientName} −${quantity} (Raison: ${reason}) → nouveau stock ${newQty}`);

      empireAudit.log({
        module: 'inventory',
        action: 'WASTE_STOCK_DEDUCTED',
        details: { wasteId, ingredientId, deducted: quantity, newQty, reason },
        severity: 'low',
        timestamp: new Date(),
      });

      // Cascade stock.low si on tombe sous le seuil
      if (stockItem.minQuantity !== undefined && newQty <= stockItem.minQuantity) {
        await NexusEventBus.emitDurable('stock.low', {
          v: 1,
          tenantId,
          itemId: ingredientId,
          itemName: ingredientName,
          currentQuantity: newQty,
          threshold: stockItem.minQuantity,
        });
      }
    },
    { id: 'waste-stock-reconciliation', priority: 'HIGH' }
  );
}
