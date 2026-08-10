import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ProductAvailabilityService } from '@/modules/logistics/stock/services/ProductAvailabilityService';
import type { Product } from '@/modules/commerce';
import type { Recipe } from '@shared/nexus/contracts/logistics';

export function registerStockZeroBlockerHandler() {
  return NexusEventBus.on(
    'stock.zero',
    async (payload) => {
      const { tenantId, itemId, itemName } = payload;

      const allProducts = (await Nexus.adapter.query<Product>(`tenants/${tenantId}/products`)) ?? [];
      for (const product of allProducts) {
        if (product.linkedStockItemId === itemId) {
          await ProductAvailabilityService.flagUnavailable(tenantId, product.id, `stock_zero: ${itemName}`);
        }
      }

      const allRecipes = (await Nexus.adapter.query<Recipe>(`tenants/${tenantId}/recipes`)) ?? [];
      const affectedRecipeIds = new Set(
        allRecipes
          .filter(r => r.ingredients?.some(ing => ing.ingredientId === itemId))
          .map(r => r.id)
      );

      if (affectedRecipeIds.size > 0) {
        for (const product of allProducts) {
          if (product.recipeId && affectedRecipeIds.has(product.recipeId)) {
            await ProductAvailabilityService.flagUnavailable(tenantId, product.id, `stock_zero (recipe): ${itemName}`);
          }
        }
      }
    },
    { id: 'stock-zero-blocker', priority: 'BACKGROUND' }
  );
}
