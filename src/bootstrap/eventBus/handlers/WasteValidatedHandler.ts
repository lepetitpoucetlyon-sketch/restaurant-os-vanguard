import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

interface WasteItem {
  productId: string;
  quantity: number;
}
interface StockRecord {
  quantity: number;
  prmp?: number;
  lowStockThreshold?: number;
}

export function registerWasteValidatedHandler() {
  return NexusEventBus.on(
    'inventory.waste_logged',
    async (payload) => {
      const { tenantId, wasteId, items } = payload;
      
      logger.info(`[Logistics] Traitement des pertes (Waste) validées : ${wasteId}`);
      
      let totalWasteValue = 0;
      
      await Nexus.adapter.runTransaction(async (transaction) => {
        for (const item of items as WasteItem[]) {
          const stockItem = await transaction.get<StockRecord>(`tenants/${tenantId}/stockItems/${item.productId}`);
          if (stockItem) {
            const newQty = stockItem.quantity - item.quantity;

            transaction.update(`tenants/${tenantId}/stockItems/${item.productId}`, {
              quantity: newQty,
            });

            // Valeur financière de la perte (PRMP)
            totalWasteValue += item.quantity * (stockItem.prmp ?? 0);

            if (newQty <= (stockItem.lowStockThreshold ?? 0)) {
              Promise.resolve().then(() => {
                if (newQty <= 0) {
                  NexusEventBus.emitDurable('stock.zero', { v: 1, tenantId, itemId: item.productId, itemName: item.productId });
                } else {
                  NexusEventBus.emitDurable('stock.low', { v: 1, tenantId, itemId: item.productId, itemName: item.productId, currentQuantity: newQty, threshold: stockItem.lowStockThreshold ?? 0 });
                }
              });
            }
          }
        }
      });
      
      logger.warn(`[Logistics] Pertes déduites. Valeur estimée de la perte: ${(totalWasteValue / 100).toFixed(2)}€`);
      
      empireAudit.log({
        module: 'inventory',
        action: 'WASTE_PROCESSED',
        details: { wasteId, totalWasteValue, itemsCount: items.length },
        severity: 'medium',
        timestamp: new Date(),
      });
      
      // On pourrait émettre un événement pour recalculer le Food Cost global
      // await NexusEventBus.emit('finance.food_cost_impacted', { ... });
    },
    { id: 'waste-validated-handler', priority: 'HIGH' }
  );
}
