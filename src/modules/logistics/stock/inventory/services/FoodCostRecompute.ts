import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Recipe, RecipeIngredient, StockItem } from '@nexus/contracts';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

interface CostAlert {
    recipeId: string;
    recipeName: string;
    previousCostInMicrounits: number;
    newCostInMicrounits: number;
    deltaPercent: number;
}

const ALERT_THRESHOLD_PERCENT = 5;

export const FoodCostRecompute = {
    async recomputeAll(tenantId: string, stockItems: StockItem[]): Promise<CostAlert[]> {
        const priceMap = new Map<string, number>();
        for (const item of stockItems) {
            if (item.priceInMicrounits != null) {
                priceMap.set(item.id, item.priceInMicrounits);
            }
        }

        const recipes = await Nexus.adapter.query<Recipe>(
            `tenants/${tenantId}/recipes`, {}
        );

        const alerts: CostAlert[] = [];

        const updates: Array<{ path: string; data: { costPriceInMicrounits: number } }> = [];

        for (const recipe of recipes) {
            if (!recipe.ingredients?.length) continue;

            let newCost = 0;
            for (const ing of recipe.ingredients as RecipeIngredient[]) {
                const unitPrice = priceMap.get(ing.ingredientId);
                if (unitPrice != null) {
                    newCost += Math.round(unitPrice * ing.quantity);
                } else if (ing.costInMicrounits != null) {
                    newCost += Math.round(ing.costInMicrounits * ing.quantity);
                }
            }

            const previousCost = recipe.costPriceInMicrounits ?? 0;
            if (newCost === previousCost) continue;

            updates.push({
                path: `tenants/${tenantId}/recipes/${recipe.id}`,
                data: { costPriceInMicrounits: newCost },
            });

            if (previousCost > 0) {
                const deltaPercent = Math.abs(((newCost - previousCost) / previousCost) * 100);
                if (deltaPercent >= ALERT_THRESHOLD_PERCENT) {
                    alerts.push({
                        recipeId: String(recipe.id),
                        recipeName: recipe.name,
                        previousCostInMicrounits: previousCost,
                        newCostInMicrounits: newCost,
                        deltaPercent: Math.round(deltaPercent * 100) / 100,
                    });
                }
            }
        }

        await Promise.all(
            updates.map(u => Nexus.adapter.update(u.path, u.data))
        );

        if (alerts.length > 0) {
            empireAudit.log({
                module: 'inventory',
                action: 'food_cost_recompute_alert',
                timestamp: new Date(),
                details: {
                    alertCount: alerts.length,
                    alerts: alerts.map(a => ({
                        recipe: a.recipeName,
                        delta: `${a.deltaPercent}%`,
                    })),
                },
            });
            logger.warn(`[FoodCost] ${alerts.length} recipes with margin alert (>${ALERT_THRESHOLD_PERCENT}% change)`);
        }

        return alerts;
    },
};
