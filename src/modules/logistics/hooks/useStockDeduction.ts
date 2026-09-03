"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { logger } from "@/lib/logger";
import { pushToRole } from '@/lib/push/pushClient';
import { useTenant } from "@/shared/hooks";
interface OrderLine {
    productId?: string;
    product_id?: string;
    quantity: number;
    name?: string;
}

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
 * ⚛️ useStockDeduction — Invariant #2 : Décrémentation Atomique Anti-Race-Condition
 *
 * After an order is completed (status: 'served' | 'paid'), call deductForOrder
 * with the order's items. For each OrderLine:
 *   1. Query 'recipes' to find the recipe matching item.productId.
 *   2. For each recipe ingredient, compute:
 *        deductQty = ingredient.quantity × orderQty × (1 + (lossRate ?? 0))
 *   3. Décrémentation atomique via Nexus.adapter.increment(path, field, -deductQty).
 *      ⚠️ NEVER use get() + update() — race condition garantie sur rush POS.
 *      L'adapter.increment() est traduit en FieldValue.increment (Firestore),
 *      transaction CAS (MockAdapter), ou équivalent selon le provider actif.
 *   4. Si le stock résultant ≤ minQuantity : alerte toast + push WebPush au chef.
 *      La lecture post-incrément est séparée et tolère une légère inconsistance
 *      (eventual consistency) — seule la décrémentation elle-même est atomique.
 *
 * Note: deductions happen automatically on order completion — the inventory
 * page shows a reminder about this behaviour in its header text.
 */

async function deductIngredientStock(
    tenantId: string | null | undefined,
    ing: RecipeIngredient,
    orderQuantity: number
): Promise<void> {
    const stockId = ing.stockItemId ?? ing.ingredientId;
    if (!stockId) return;

    const itemPath = tenantId
        ? `tenants/${tenantId}/stockItems/${stockId}`
        : `stockItems/${stockId}`;

    try {
        const deductQty = ing.quantity * orderQuantity * (1 + (ing.lossRate ?? 0));
        await Nexus.adapter.increment(itemPath, 'quantityInStock', -deductQty);
        await Nexus.adapter.increment(itemPath, 'quantity', -deductQty);

        logger.debug(
            `[useStockDeduction] ⚛️ stockItems/${stockId}: -${deductQty} (atomique, loss×${1 + (ing.lossRate ?? 0)})`
        );

        const stockItem = await Nexus.adapter.get<StockItemDoc>(itemPath);
        if (!stockItem) return;

        const newQty = stockItem.quantityInStock ?? stockItem.quantity ?? 0;
        const minQty = stockItem.minQuantity;
        if (minQty !== undefined && newQty <= minQty) {
            const ingredientName = stockItem.ingredientName ?? ing.ingredientId;
            toast.warning(`Stock bas : ${ingredientName}`);
            if (tenantId) {
                pushToRole(tenantId, 'chef_cuisinier', {
                    title: 'Alerte stock critique',
                    body: `${ingredientName} : stock bas (${newQty} ${ing.unit ?? ''})`,
                    url: '/inventory',
                });
            }
        }
    } catch (err) {
        logger.error(`[useStockDeduction] Failed to deduct ingredient ${stockId}`, err);
    }
}

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
            const pId = line.productId ?? line.product_id;
            if (!pId) continue;
            const recipe = recipeMap.get(pId);
            if (!recipe?.ingredients?.length) {
                logger.debug(
                    `[useStockDeduction] No recipe found for productId ${pId} — skipping`
                );
                continue;
            }

            for (const ing of recipe.ingredients) {
                await deductIngredientStock(tenantId, ing, line.quantity);
            }
        }
    }, [tenantId]);

    return { deductForOrder };
}
