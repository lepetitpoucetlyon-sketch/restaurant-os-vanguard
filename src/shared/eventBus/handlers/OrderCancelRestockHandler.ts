import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerOrderCancelRestockHandler() {
  return NexusEventBus.on(
    'order.cancelled',
    async (payload) => {
      const { tenantId, orderId } = payload;
      
      const order = await Nexus.adapter.get(`tenants/${tenantId}/orders/${orderId}`) as any;
      if (!order) return;
      
      // Si la commande n'était pas encore lancée en cuisine, on peut restituer le stock
      if (order.status !== 'in_preparation' && order.status !== 'ready' && order.status !== 'delivered') {
        logger.info(`[Restock] Restitution des stocks pour la commande annulée ${orderId}`);
        
        // Pour chaque article, on pourrait exploser la recette et incrémenter les ingrédients
        // C'est l'opération inverse de StockDeductionHandler
        for (const item of order.items) {
          const recipe = await Nexus.adapter.get(`tenants/${tenantId}/recipes/${item.productId}`) as any;
          if (recipe && recipe.ingredients) {
            for (const ing of recipe.ingredients) {
              const qtyToRestore = ing.quantity * item.quantity;
              
              await Nexus.adapter.runTransaction(async (transaction) => {
                const stockItem = await transaction.get(`tenants/${tenantId}/stockItems/${ing.stockItemId}`) as any;
                if (stockItem) {
                  transaction.update(`tenants/${tenantId}/stockItems/${ing.stockItemId}`, {
                    quantity: (stockItem.quantity as number) + qtyToRestore,
                  });
                }
              });
              
              logger.debug(`[Restock] Restitué ${qtyToRestore} de ${ing.stockItemId}`);
            }
          }
        }
        
        empireAudit.log({
          module: 'inventory',
          action: 'ORDER_RESTOCKED',
          details: { orderId },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'order-cancel-restock-handler', priority: 'BACKGROUND' }
  );
}
