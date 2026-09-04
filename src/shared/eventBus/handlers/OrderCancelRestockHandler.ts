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

import { IdempotencyGuard } from '../IdempotencyGuard';

async function restoreIngredients(tenantId: string, items: Array<{ productId: string; quantity: number }>) {
  for (const item of items) {
    const recipe = await Nexus.adapter.get<RecipeRecord>(`tenants/${tenantId}/recipes/${item.productId}`);
    if (!recipe?.ingredients) continue;
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

export function registerOrderCancelRestockHandler() {
  return NexusEventBus.on(
    'order.cancelled',
    IdempotencyGuard.withIdempotencyGuard(
      'order-cancel-restock-handler',
      'order.cancelled',
      async (payload) => {
        const { tenantId, orderId } = payload;
        
        const order = await Nexus.adapter.get<Order>(`tenants/${tenantId}/ops_flows/${orderId}`);
        if (!order?.items || order.status === 'cancelled') {
          if (order?.status === 'cancelled') {
            logger.info(`[Restock] Commande déjà marquée annulée et restituée, skip.`, { orderId });
          }
          return;
        }
        
        const isKitchenStarted = ['preparing', 'ready', 'delivered'].includes(order.status);
        if (!isKitchenStarted) {
          logger.info(`[Restock] Restitution des stocks pour la commande annulée ${orderId}`);
          await restoreIngredients(tenantId, order.items);

          await Nexus.adapter.update(`tenants/${tenantId}/ops_flows/${orderId}`, {
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          });
          
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
      }
    ),
    // `idempotent: false` = opt-out EXPLICITE de l'emballage automatique du bus :
    // l'idempotence est déjà assurée par le `withIdempotencyGuard` manuel ci-dessus.
    // Sans ce false, l'auto-idempotence des events de mutation (mutationEvents) créerait
    // un DOUBLE-emballage → le wrap interne saute le vrai travail (audit 2026-09).
    { id: 'order-cancel-restock-handler', priority: 'BACKGROUND', idempotent: false }
  );
}
