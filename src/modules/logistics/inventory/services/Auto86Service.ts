import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { StockItem, Recipe, RecipeIngredient } from '@nexus/contracts';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

interface CriticalityEntry {
    stockItemId: string;
    stockItemName: string;
    quantityInStock: number;
    criticalThreshold: number;
}

async function updateProductAvailability(
    tenantId: string,
    product: { id: string; recipeId?: string; isAvailable?: boolean },
    blockedRecipeIds: Set<string>,
    eightySixed: string[],
    restored: string[],
): Promise<void> {
    if (!product.recipeId) return;
    const shouldBeUnavailable = blockedRecipeIds.has(product.recipeId);
    const currentlyAvailable = product.isAvailable !== false;
    if (shouldBeUnavailable && currentlyAvailable) {
        await Nexus.adapter.update(`tenants/${tenantId}/products/${product.id}`, { isAvailable: false });
        eightySixed.push(product.id);
    } else if (!shouldBeUnavailable && !currentlyAvailable) {
        await Nexus.adapter.update(`tenants/${tenantId}/products/${product.id}`, { isAvailable: true });
        restored.push(product.id);
    }
}

export const Auto86Service = {
    async evaluate(tenantId: string): Promise<{ eightySixed: string[]; restored: string[] }> {
        const [stockItems, recipes, products] = await Promise.all([
            Nexus.adapter.query<StockItem>(
                `tenants/${tenantId}/stockItems`, {}
            ),
            Nexus.adapter.query<Recipe>(
                `tenants/${tenantId}/recipes`, {}
            ),
            Nexus.adapter.query<{ id: string; isAvailable?: boolean; recipeId?: string }>(
                `tenants/${tenantId}/products`, {}
            ),
        ]);

        const criticalItems = new Map<string, CriticalityEntry>();
        for (const item of stockItems) {
            const threshold = item.minQuantity ?? 0;
            if (threshold > 0 && item.quantity <= threshold) {
                criticalItems.set(item.ingredientId ?? item.id, {
                    stockItemId: item.id,
                    stockItemName: item.ingredientName ?? item.name ?? item.id,
                    quantityInStock: item.quantity,
                    criticalThreshold: threshold,
                });
            }
        }

        const blockedRecipeIds = new Set<string>();
        for (const recipe of recipes) {
            if (!recipe.ingredients?.length) continue;
            const hasBlockingIngredient = recipe.ingredients.some(
                (ing: RecipeIngredient) => criticalItems.has(ing.ingredientId)
            );
            if (hasBlockingIngredient) {
                blockedRecipeIds.add(String(recipe.id));
            }
        }

        const eightySixed: string[] = [];
        const restored: string[] = [];

        for (const product of products) {
            await updateProductAvailability(tenantId, product, blockedRecipeIds, eightySixed, restored);
        }

        if (eightySixed.length > 0 || restored.length > 0) {
            empireAudit.log({
                module: 'inventory',
                action: 'auto_86_propagation',
                timestamp: new Date(),
                details: {
                    eightySixed,
                    restored,
                    criticalItems: Array.from(criticalItems.values()).map(c => c.stockItemName),
                } as unknown as import('@/shared/nexus-contract').SovereignData,
            });
            logger.info(`[Auto86] 86'd ${eightySixed.length} products, restored ${restored.length}`);
        }

        return { eightySixed, restored };
    },

    getCriticalityMatrix(stockItems: StockItem[]): CriticalityEntry[] {
        return stockItems
            .filter(item => (item.minQuantity ?? 0) > 0)
            .map(item => ({
                stockItemId: item.id,
                stockItemName: item.ingredientName ?? item.name ?? item.id,
                quantityInStock: item.quantity,
                criticalThreshold: item.minQuantity!,
            }))
            .sort((a, b) => {
                const ratioA = a.quantityInStock / a.criticalThreshold;
                const ratioB = b.quantityInStock / b.criticalThreshold;
                return ratioA - ratioB;
            });
    },
};
