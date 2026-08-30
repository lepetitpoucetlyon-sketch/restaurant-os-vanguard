import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Recipe, RecipeIngredient } from '@nexus/contracts';

interface PrepItem {
    recipeId: string;
    recipeName: string;
    estimatedPortions: number;
    ingredients: Array<{
        ingredientId: string;
        ingredientName: string;
        quantityNeeded: number;
        unit: string;
    }>;
}

interface PrepForecastResult {
    date: string;
    items: PrepItem[];
    totalRecipes: number;
}

export const PrepForecastService = {
    async forecastNextDay(tenantId: string, targetDate: string): Promise<PrepForecastResult> {
        const dayOfWeek = new Date(targetDate).getDay();
        const lookbackWeeks = 4;
        const lookbackStart = new Date(targetDate);
        lookbackStart.setDate(lookbackStart.getDate() - lookbackWeeks * 7);

        const [orders, recipes] = await Promise.all([
            Nexus.adapter.query<{
                id: string;
                items: Array<{ productId: string; quantity: number }>;
                createdAt: string;
            }>(
                `tenants/${tenantId}/ops_flows`,
                {
                    where: [
                        { field: 'createdAt', operator: '>=', value: lookbackStart.toISOString() },
                    ],
                }
            ),
            Nexus.adapter.query<Recipe>(
                `tenants/${tenantId}/recipes`, {}
            ),
        ]);

        const sameDayOrders = orders.filter(o => {
            const d = new Date(o.createdAt);
            return d.getDay() === dayOfWeek;
        });

        const productSales = new Map<string, number>();
        for (const order of sameDayOrders) {
            for (const item of order.items ?? []) {
                productSales.set(
                    item.productId,
                    (productSales.get(item.productId) ?? 0) + item.quantity
                );
            }
        }

        const weeksCount = Math.max(1, lookbackWeeks);

        const recipeMap = new Map(recipes.map(r => [String(r.id), r]));
        const items: PrepItem[] = [];

        const products = await Nexus.adapter.query<{ id: string; recipeId?: string }>(
            `tenants/${tenantId}/products`, {}
        );

        for (const product of products) {
            if (!product.recipeId) continue;
            const avgSales = (productSales.get(product.id) ?? 0) / weeksCount;
            if (avgSales < 1) continue;

            const recipe = recipeMap.get(product.recipeId);
            if (!recipe) continue;

            const portions = Math.ceil(avgSales * 1.1);

            items.push({
                recipeId: String(recipe.id),
                recipeName: recipe.name,
                estimatedPortions: portions,
                ingredients: (recipe.ingredients as RecipeIngredient[]).map(ing => ({
                    ingredientId: ing.ingredientId,
                    ingredientName: ing.name,
                    quantityNeeded: Math.round(ing.quantity * portions * 100) / 100,
                    unit: ing.unit,
                })),
            });
        }

        items.sort((a, b) => b.estimatedPortions - a.estimatedPortions);

        return {
            date: targetDate,
            items,
            totalRecipes: items.length,
        };
    },
};
