import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { Recipe } from '@shared/nexus/contracts/logistics';
import type { Product } from '@/domain/schemas/commerce';

type StockItem = {
  id: string;
  lastCostInMicrounits?: number;
};

/**
 * P2-3: Inflation Shield - FoodCostRecomputer
 * Recalcule le food cost des produits finis suite à la variation 
 * des prix fournisseurs (réception de facture).
 */
export function registerFoodCostRecomputer(): () => void {
  return NexusEventBus.on(
    'supplier.invoice_processed',
    async (payload) => {
      const { tenantId, invoiceId, lines } = payload;
      
      try {
        // 1. Mettre à jour les coûts unitaires des items de stock
        for (const line of lines) {
          await Nexus.adapter.update(
            `tenants/${tenantId}/stockItems/${line.stockItemId}`,
            { lastCostInMicrounits: line.unitCostInMicrounits }
          );
        }

        // 2. Récupérer tous les stockItems pour avoir les prix à jour
        const stockItemsRaw = await Nexus.adapter.get<Record<string, StockItem>>(`tenants/${tenantId}/stockItems`);
        const stockItems = stockItemsRaw ? Object.values(stockItemsRaw) : [];
        const costMap = new Map<string, number>();
        for (const s of stockItems) {
            costMap.set(s.id, s.lastCostInMicrounits ?? 0);
        }

        // 3. Récupérer tous les produits et toutes les recettes
        const productsRaw = await Nexus.adapter.get<Record<string, Product>>(`tenants/${tenantId}/products`);
        const recipesRaw = await Nexus.adapter.get<Record<string, Recipe>>(`tenants/${tenantId}/recipes`);
        
        if (!productsRaw) return;
        const products = Object.values(productsRaw);

        for (const product of products) {
            let totalCost = 0;
            let impacted = false;

            if ((product as any).recipeId && recipesRaw) {
                const recipe = recipesRaw[(product as any).recipeId];
                if (recipe && recipe.ingredients) {
                    for (const ing of recipe.ingredients) {
                        const ingId = ing.ingredientId;
                        if (!ingId) continue;
                        if (lines.some(l => l.stockItemId === ingId)) {
                            impacted = true;
                        }
                        const cost = costMap.get(ingId) ?? 0;
                        // On suppose que ing.quantity est dans la même unité de mesure que le stockItem
                        totalCost += cost * ing.quantity;
                    }
                }
            } else if ((product as any).linkedStockItemId) {
                const ingId = (product as any).linkedStockItemId;
                if (lines.some(l => l.stockItemId === ingId)) {
                    impacted = true;
                }
                totalCost = costMap.get(ingId) ?? 0;
            }

            if (impacted && product.priceInMicrounits > 0) {
                // Marge en basis points (BPS) : 10000 = 100%
                const margin = product.priceInMicrounits - totalCost;
                const marginBps = Math.floor((margin / product.priceInMicrounits) * 10000);

                const thresholdBps = 2500; // Seuil hardcodé à 25% pour l'exemple P2

                if (marginBps < thresholdBps) {
                    logger.warn(`[FoodCostRecomputer] Marge critique sur ${product.name} : ${marginBps} bps (Seuil: ${thresholdBps})`);
                    await NexusEventBus.emitDurable('commerce.margin_warning', {
                        v: 1,
                        tenantId,
                        productId: product.id,
                        currentMarginBps: marginBps,
                        thresholdBps,
                        triggerEventId: invoiceId
                    });
                } else {
                    logger.info(`[FoodCostRecomputer] ${product.name} marge OK : ${marginBps} bps`);
                }
            }
        }
      } catch (e) {
          logger.error('[FoodCostRecomputer] Erreur de recalcul', e);
          throw e; // Laisse la DLQ s'en occuper
      }
    },
    { id: 'food-cost-recomputer', priority: 'HIGH' }
  );
}
