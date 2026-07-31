import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ProductAvailabilityService } from '@/domain/services/ProductAvailabilityService';
import type { Product } from '@/domain/schemas/commerce';
import type { Recipe } from '@shared/nexus/contracts/logistics';

export function registerStockZeroBlockerHandler() {
  return NexusEventBus.on(
    'stock.zero',
    async (payload) => {
      const tenantId = payload.tenantId;
      const itemId = payload.itemId;

      // 1. Check direct link
      const allProducts = await Nexus.adapter.query<Product>(`tenants/${tenantId}/products`);
      for (const product of allProducts) {
        if (product.linkedStockItemId === itemId) {
          await ProductAvailabilityService.flagUnavailable(tenantId, product.id, `stock_zero: ${payload.itemName}`);
        }
      }

      // 2. Check recipe link
      const allRecipes = await Nexus.adapter.query<Recipe>(`tenants/${tenantId}/recipes`);
      const affectedRecipeIds = new Set(
        allRecipes
          .filter(r => r.ingredients?.some(ing => ing.ingredientId === itemId))
          .map(r => r.id)
      );

      if (affectedRecipeIds.size > 0) {
        for (const product of allProducts) {
          if (product.recipeId && affectedRecipeIds.has(product.recipeId)) {
            await ProductAvailabilityService.flagUnavailable(tenantId, product.id, `stock_zero (recipe): ${payload.itemName}`);
          }
        }
      }
    },
    { id: 'stock-zero-blocker', priority: 'BACKGROUND' }
  );
}
