import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { Order } from '@nexus/contracts';

interface RecipeIngredient {
  stockItemId: string;
  quantity: number;
}
interface RecipeRecord {
  id: string;
  ingredients?: RecipeIngredient[];
}
interface StockRecord {
  id: string;
  quantity: number;
}

export function registerOrderCancelRestockHandler() {
  return NexusEventBus.on(
    'order.cancelled',
    async (payload) => {
      const { tenantId, orderId } = payload;
      
      const order = await Nexus.adapter.get<Order>(`tenants/${tenantId}/ops_flows/${orderId}`);
      if (!order || !order.items) return;
      
      // Si la commande n'était pas encore lancée en cuisine, on peut restituer le stock
      if (order.status !== 'preparing' && order.status !== 'ready' && order.status !== 'delivered') {
        logger.info(`[Restock] Restitution des stocks pour la commande annulée ${orderId}`);
        
        // Pour chaque article, on pourrait exploser la recette et incrémenter les ingrédients
        // C'est l'opération inverse de StockDeductionHandler
        for (const item of order.items) {
          const recipe = await Nexus.adapter.get<RecipeRecord>(`tenants/${tenantId}/recipes/${item.productId}`);
          if (recipe && recipe.ingredients) {
            for (const ing of recipe.ingredients) {
              const qtyToRestore = ing.quantity * item.quantity;
              
              await Nexus.adapter.runTransaction(async (transaction) => {
                const stockItem = await transaction.get<StockRecord>(`tenants/${tenantId}/stockItems/${ing.stockItemId}`);
                if (stockItem) {
                  transaction.update(`tenants/${tenantId}/stockItems/${ing.stockItemId}`, {
                    quantity: stockItem.quantity + qtyToRestore,
                  });
                }
              });
              
              logger.debug(`[Restock] Restitué ${qtyToRestore} de ${ing.stockItemId}`);
            }
          }
        }
        
        if (order.tableId) {
          await NexusEventBus.emitDurable('table.released', {
            v: 1,
            tenantId,
            tableId: order.tableId,
            orderId,
          });
          logger.info(`[Restock] Table ${order.tableId} libérée suite à l'annulation de la commande ${orderId}`);
        }

        empireAudit.log({
          module: 'inventory',
          action: 'ORDER_RESTOCKED',
          details: { orderId, tableId: order.tableId },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'order-cancel-restock-handler', priority: 'BACKGROUND' }
  );
}
