import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { Recipe } from '@shared/nexus/contracts/logistics';

type StockProduct = {
  linkedStockItemId?: string;
  recipeId?: string;
};

type StockItem = {
  quantity?: number;
  reorderThreshold?: number;
};

/**
 * Déduit les stocks consommés lors d'un paiement validé.
 *
 * Priorité :
 *  1. Si product.recipeId → explosion BOM "au gramme" via recipe.ingredients
 *  2. Sinon si product.linkedStockItemId → déduction 1:1 (fallback simple)
 */
async function deductStockForLines(
  tenantId: string,
  orderId: string,
  lines: { stockItemId: string; quantity: number }[],
): Promise<void> {
  const deductedItems: string[] = [];
  await Promise.allSettled(
    lines.map(async (line) => {
      await _deductStock(tenantId, line.stockItemId, line.quantity, line.stockItemId);
      deductedItems.push(`${line.stockItemId} ×${line.quantity}`);
    })
  );
  if (deductedItems.length === 0) return;
  empireAudit.log({
    module: 'inventory',
    action: 'STOCK_DEDUCTED',
    details: { orderId, deductions: deductedItems },
    severity: 'low',
    timestamp: new Date(),
  });
}

/** Consomme inventory.deducted émis par les verticals (retail, restaurant) */
export function registerInventoryDeductedHandler(): () => void {
  return NexusEventBus.on(
    'inventory.deducted',
    async ({ tenantId, orderId, lines }) => {
      await deductStockForLines(tenantId, orderId, lines);
    },
    { id: 'inventory-deducted', priority: 'HIGH' }
  );
}

export function registerStockDeductionHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    async ({ tenantId, items, orderId }) => {
      const deductedItems: string[] = [];

      await Promise.allSettled(
        items.map(async (item) => {
          const product = await Nexus.adapter.get<StockProduct>(
            `tenants/${tenantId}/products/${item.productId}`
          );
          if (!product) return;

          if (product.recipeId) {
            // ── BOM expansion "au gramme" ─────────────────────────────────────
            const recipe = await Nexus.adapter.get<Recipe>(
              `tenants/${tenantId}/recipes/${product.recipeId}`
            );
            if (!recipe?.ingredients?.length) return;

            await Promise.allSettled(
              recipe.ingredients.map(async (ing) => {
                if (!ing.ingredientId) return;
                const deductQty = ing.quantity * item.quantity;
                await _deductStock(tenantId, ing.ingredientId, deductQty, ing.name ?? ing.ingredientId);
                deductedItems.push(`${ing.name ?? ing.ingredientId} ×${deductQty}`);
              })
            );
          } else if (product.linkedStockItemId) {
            // ── Déduction 1:1 (fallback pour items sans recette) ─────────────
            await _deductStock(tenantId, product.linkedStockItemId, item.quantity, item.name);
            deductedItems.push(`${item.name} ×${item.quantity}`);
          }
        })
      );

      if (deductedItems.length === 0) return;

      empireAudit.log({
        module: 'inventory',
        action: 'STOCK_DEDUCTED',
        details: { orderId, deductions: deductedItems },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'stock-deduction', priority: 'HIGH' }
  );
}

async function _deductStock(
  tenantId: string,
  stockItemId: string,
  qty: number,
  label: string,
): Promise<void> {
  const path = `tenants/${tenantId}/stockItems/${stockItemId}`;
  const stockItem = await Nexus.adapter.get<StockItem>(path);
  if (!stockItem) return;

  const newQty = Math.max(0, (stockItem.quantity ?? 0) - qty);
  await Nexus.adapter.update(path, {
    quantity: newQty,
    updatedAt: new Date().toISOString(),
  });

  logger.info(`[StockDeduction] ${label} −${qty} → stock ${newQty}`);

  if (stockItem.reorderThreshold !== undefined && newQty <= stockItem.reorderThreshold) {
    await NexusEventBus.emitDurable('stock.low', {
      v: 1,
      tenantId,
      itemId: stockItemId,
      itemName: label,
      currentQuantity: newQty,
      threshold: stockItem.reorderThreshold,
    });
  }

  if (newQty <= 0) {
    await NexusEventBus.emitDurable('stock.zero', {
      v: 1,
      tenantId,
      itemId: stockItemId,
      itemName: label,
    });
  }
}
