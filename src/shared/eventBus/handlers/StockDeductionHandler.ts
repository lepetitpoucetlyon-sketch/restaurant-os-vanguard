import { NexusEventBus } from '../NexusEventBus';
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
  const results = await Promise.allSettled(
    lines.map(async (line) => {
      await _deductStock(tenantId, line.stockItemId, line.quantity, line.stockItemId);
      deductedItems.push(`${line.stockItemId} ×${line.quantity}`);
    })
  );
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    throw new Error(`[StockDeductionHandler] ${failures.length}/${lines.length} déductions ont échoué`);
  }
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

  // Vérifier l'existence avant le décrémentation atomique
  const existing = await Nexus.adapter.get<StockItem>(path);
  if (!existing) return;

  // Décrémentation atomique — Invariant #2 concurrence (FieldValue.increment sur Firestore)
  await Nexus.adapter.increment(path, 'quantity', -qty);
  await Nexus.adapter.update(path, { updatedAt: new Date().toISOString() });

  // Re-lecture pour les alertes seuil (best-effort post-decrement)
  const updated = await Nexus.adapter.get<StockItem>(path);
  const newQty = Math.max(0, updated?.quantity ?? 0);

  logger.info(`[StockDeduction] ${label} −${qty} → stock ${newQty}`);

  if (existing.reorderThreshold !== undefined && newQty <= existing.reorderThreshold) {
    await NexusEventBus.emitDurable('stock.low', {
      v: 1,
      tenantId,
      itemId: stockItemId,
      itemName: label,
      currentQuantity: newQty,
      threshold: existing.reorderThreshold,
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
