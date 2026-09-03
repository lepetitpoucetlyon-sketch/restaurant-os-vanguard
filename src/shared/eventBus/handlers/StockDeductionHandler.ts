import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { Recipe } from '@shared/nexus/contracts/logistics';

import { IdempotencyGuard } from '../IdempotencyGuard';

type StockProduct = {
  name?: string;
  linkedStockItemId?: string;
  recipeId?: string;
};

export type StockItem = {
  quantity?: number;
  reorderThreshold?: number;
  isNegative?: boolean;
  negativeSince?: string | null;
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
      await deductStockItem(tenantId, line.stockItemId, line.quantity, line.stockItemId);
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
    async ({ tenantId, items, orderId, occurredAt, businessDay }) => {
      const deductedItems: string[] = [];

      await Promise.allSettled(
        items.map(async (item) => {
          const product = await Nexus.adapter.get<StockProduct>(
            `tenants/${tenantId}/products/${item.productId}`
          );

          // Si le produit n'existe pas ou n'a ni recette ni lien stock : mise en attente (Lot 2 - M1/M2)
          if (!product || (!product.recipeId && !product.linkedStockItemId)) {
            const deductionId = `pending_deduct_${orderId}_${item.productId}`;
            const pendingPath = `tenants/${tenantId}/pending_stock_deductions/${deductionId}`;
            await Nexus.adapter.set(pendingPath, {
              id: deductionId,
              tenantId,
              orderId,
              productId: item.productId,
              productName: item.name,
              quantity: item.quantity,
              soldAt: occurredAt ?? new Date().toISOString(),
              businessDay,
              status: 'pending',
              createdAt: new Date().toISOString(),
            });

            await NexusEventBus.emitDurable('stock.pending_recipe_deduction', {
              v: 1,
              tenantId,
              deductionId,
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              soldAt: occurredAt ?? new Date().toISOString(),
              businessDay,
            });
            return;
          }

          if (product.recipeId) {
            // ── BOM expansion "au gramme" ─────────────────────────────────────
            const recipe = await Nexus.adapter.get<Recipe>(
              `tenants/${tenantId}/recipes/${product.recipeId}`
            );
            if (!recipe?.ingredients?.length) {
              // Recette déclarée mais sans ingrédients saisis : mise en attente
              const deductionId = `pending_deduct_${orderId}_${item.productId}`;
              const pendingPath = `tenants/${tenantId}/pending_stock_deductions/${deductionId}`;
              await Nexus.adapter.set(pendingPath, {
                id: deductionId,
                tenantId,
                orderId,
                productId: item.productId,
                productName: item.name,
                quantity: item.quantity,
                soldAt: occurredAt ?? new Date().toISOString(),
                businessDay,
                status: 'pending',
                createdAt: new Date().toISOString(),
              });
              return;
            }

            await Promise.allSettled(
              recipe.ingredients.map(async (ing) => {
                if (!ing.ingredientId) return;
                const deductQty = ing.quantity * item.quantity;
                await deductStockItem(tenantId, ing.ingredientId, deductQty, ing.name ?? ing.ingredientId);
                deductedItems.push(`${ing.name ?? ing.ingredientId} ×${deductQty}`);
              })
            );
          } else if (product.linkedStockItemId) {
            // ── Déduction 1:1 (fallback pour items sans recette) ─────────────
            await deductStockItem(tenantId, product.linkedStockItemId, item.quantity, item.name);
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

/**
 * Décrémentation atomique de stock avec tolérance native aux stocks négatifs (Lot 2 - M1).
 * L'encaissement n'est jamais bloqué.
 */
export async function deductStockItem(
  tenantId: string,
  stockItemId: string,
  qty: number,
  label: string,
): Promise<void> {
  const path = `tenants/${tenantId}/stockItems/${stockItemId}`;

  // Vérifier l'existence avant la décrémentation atomique
  const existing = await Nexus.adapter.get<StockItem>(path);
  if (!existing) return;

  // Décrémentation atomique — Invariant #2 concurrence
  await Nexus.adapter.increment(path, 'quantity', -qty);
  await Nexus.adapter.update(path, { updatedAt: new Date().toISOString() });

  // Re-lecture pour alertes seuil et stock négatif
  const updated = await Nexus.adapter.get<StockItem>(path);
  const actualQty = updated?.quantity ?? 0;

  logger.info(`[StockDeduction] ${label} −${qty} → stock ${actualQty}`);

  if (actualQty < 0) {
    await Nexus.adapter.update(path, {
      isNegative: true,
      negativeSince: existing.negativeSince ?? new Date().toISOString(),
    });

    await NexusEventBus.emitDurable('stock.negative_alert', {
      v: 1,
      tenantId,
      itemId: stockItemId,
      itemName: label,
      currentQuantity: actualQty,
      deficit: Math.abs(actualQty),
    });
  } else if (existing.isNegative) {
    await Nexus.adapter.update(path, {
      isNegative: false,
      negativeSince: null,
    });
  }

  if (existing.reorderThreshold !== undefined && actualQty <= existing.reorderThreshold) {
    await NexusEventBus.emitDurable('stock.low', {
      v: 1,
      tenantId,
      itemId: stockItemId,
      itemName: label,
      currentQuantity: actualQty,
      threshold: existing.reorderThreshold,
    });
  }

  if (actualQty <= 0) {
    await NexusEventBus.emitDurable('stock.zero', {
      v: 1,
      tenantId,
      itemId: stockItemId,
      itemName: label,
    });
  }
}
