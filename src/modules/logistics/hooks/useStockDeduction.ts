"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { logger } from "@/lib/logger";
import { pushToRole } from '@/lib/push/pushClient';
import { useTenant } from "@/shared/hooks";
import type { OrderLine } from "@/modules/ops";

interface RecipeIngredient {
    ingredientId: string;
    stockItemId?: string;
    /** Net quantity per 1 unit of product */
    quantity: number;
    /** Loss factor: 0.1 = 10 % waste on top of net qty */
    lossRate?: number;
    unit?: string;
}

interface RecipeDoc {
    id: string;
    productId: string;
    ingredients?: RecipeIngredient[];
}

interface StockItemDoc {
    quantityInStock?: number;
    quantity?: number;
    minQuantity?: number;
    ingredientName?: string;
}

/**
 * log-4: useStockDeduction
 *
 * After an order is completed (status: 'served' | 'paid'), call deductForOrder
 * with the order's items. For each OrderLine:
 *   1. Query 'recipes' to find the recipe matching item.productId.
 *   2. For each recipe ingredient, compute:
 *        deductQty = ingredient.quantity × orderQty × (1 + (lossRate ?? 0))
 *   3. Decrement the matching stockItem's quantity.
 *   4. If the resulting quantity ≤ minQuantity, show a low-stock warning toast.
 *
 * Note: deductions happen automatically on order completion — the inventory
 * page shows a reminder about this behaviour in its header text.
 */
export function useStockDeduction() {
    const { tenantId } = useTenant();
    const deductForOrder = useCallback(async (items: OrderLine[]): Promise<void> => {
        if (!items.length) return;

        // Fetch all recipes once and build a productId → RecipeDoc map
        let recipeMap: Map<string, RecipeDoc> = new Map();
        try {
            const recipePath = tenantId ? `tenants/${tenantId}/recipes` : "recipes";
            const recipes = await Nexus.adapter.query<RecipeDoc>(recipePath);
            recipeMap = new Map(
                (recipes ?? [])
                    .filter((r) => r.productId)
                    .map((r) => [r.productId, r])
            );
        } catch (err) {
            logger.error("[useStockDeduction] Failed to load recipes", err);
            return;
        }

        for (const line of items) {
            const recipe = recipeMap.get(line.productId);
            if (!recipe?.ingredients?.length) {
                logger.debug(
                    `[useStockDeduction] No recipe found for productId ${line.productId} — skipping`
                );
                continue;
            }

            for (const ing of recipe.ingredients) {
                // Prefer explicit stockItemId, fall back to ingredientId
                const stockId = ing.stockItemId ?? ing.ingredientId;
                if (!stockId) continue;

                try {
                    const itemPath = tenantId ? `tenants/${tenantId}/stockItems/${stockId}` : `stockItems/${stockId}`;
                    const stockItem = await Nexus.adapter.get<StockItemDoc>(itemPath);
                    if (!stockItem) {
                        logger.debug(
                            `[useStockDeduction] ${itemPath} not found — skipping`
                        );
                        continue;
                    }

                    const currentQty =
                        stockItem.quantityInStock ?? stockItem.quantity ?? 0;

                    // log-4: Apply loss rate on top of net quantity
                    const deductQty =
                        ing.quantity * line.quantity * (1 + (ing.lossRate ?? 0));
                    const newQty = Math.max(0, currentQty - deductQty);

                    await Nexus.adapter.update(itemPath, {
                        quantityInStock: newQty,
                        quantity: newQty,
                        lastDeductionAt: new Date().toISOString(),
                    });

                    logger.debug(
                        `[useStockDeduction] stockItems/${stockId}: ${currentQty} → ${newQty} (-${deductQty})`
                    );

                    // log-4: Warn when stock falls to or below alert threshold
                    const minQty = stockItem.minQuantity;
                    if (minQty !== undefined && newQty <= minQty) {
                        const ingredientName =
                            stockItem.ingredientName ?? ing.ingredientId;
                        toast.warning(`Stock bas : ${ingredientName}`);
                        // not-4: Push critical stock alert to kitchen chef
                        if (tenantId) pushToRole(tenantId, 'chef_cuisinier', {
                            title: 'Alerte stock critique',
                            body: `${ingredientName} : stock bas (${newQty} ${ing.unit ?? ''})`,
                            url: '/inventory',
                        });
                    }
                } catch (err) {
                    logger.error(
                        `[useStockDeduction] Failed to update stockItems/${stockId}`,
                        err
                    );
                }
            }
        }
    }, [tenantId]);

    return { deductForOrder };
}
