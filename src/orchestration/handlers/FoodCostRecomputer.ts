/* eslint-disable no-restricted-imports -- tolerated structural inversion */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { Recipe } from '@shared/nexus/contracts/logistics';
import type { Product } from '@nexus/contracts';

type StockItem = {
  id: string;
  lastCostInMicrounits?: number;
};

/** Product with optional recipe/stock link (runtime Firestore shape) */
type ProductWithLinks = Product & {
  recipeId?: string;
  linkedStockItemId?: string;
};

function computeProductCostAndImpact(
  product: ProductWithLinks,
  recipesRaw: Record<string, Recipe> | null,
  costMap: Map<string, number>,
  updatedStockItemIds: Set<string>
): { totalCost: number; impacted: boolean } {
  let totalCost = 0;
  let impacted = false;

  if (product.recipeId && recipesRaw) {
    const recipe = recipesRaw[product.recipeId];
    if (recipe && recipe.ingredients) {
      for (const ing of recipe.ingredients) {
        const ingId = ing.ingredientId;
        if (!ingId) continue;
        if (updatedStockItemIds.has(ingId)) impacted = true;
        totalCost += (costMap.get(ingId) ?? 0) * ing.quantity;
      }
    }
  } else if (product.linkedStockItemId) {
    const ingId = product.linkedStockItemId;
    if (updatedStockItemIds.has(ingId)) impacted = true;
    totalCost = costMap.get(ingId) ?? 0;
  }

  return { totalCost, impacted };
}

async function evaluateProductMargin(
  product: Product,
  totalCost: number,
  tenantId: string,
  invoiceId: string
): Promise<void> {
  if (product.priceInMicrounits <= 0) return;

  const margin = product.priceInMicrounits - totalCost;
  const marginBps = Math.floor((margin / product.priceInMicrounits) * 10000);
  const thresholdBps = 2500;

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
        for (const line of lines) {
          await Nexus.adapter.update(
            `tenants/${tenantId}/stockItems/${line.stockItemId}`,
            { lastCostInMicrounits: line.unitCostInMicrounits }
          );
        }

        const stockItemsRaw = await Nexus.adapter.get<Record<string, StockItem>>(`tenants/${tenantId}/stockItems`);
        const stockItems = stockItemsRaw ? Object.values(stockItemsRaw) : [];
        const costMap = new Map<string, number>();
        for (const s of stockItems) {
          costMap.set(s.id, s.lastCostInMicrounits ?? 0);
        }

        const productsRaw = await Nexus.adapter.get<Record<string, Product>>(`tenants/${tenantId}/products`);
        const recipesRaw = await Nexus.adapter.get<Record<string, Recipe>>(`tenants/${tenantId}/recipes`);
        
        if (!productsRaw) return;
        const products = Object.values(productsRaw);
        const updatedStockItemIds = new Set(lines.map(l => l.stockItemId));

        for (const product of products) {
          const { totalCost, impacted } = computeProductCostAndImpact(product, recipesRaw, costMap, updatedStockItemIds);
          if (impacted) {
            await evaluateProductMargin(product, totalCost, tenantId, invoiceId);
          }
        }
      } catch (e) {
        logger.error('[FoodCostRecomputer] Erreur de recalcul', e);
        throw e;
      }
    },
    { id: 'food-cost-recomputer', priority: 'HIGH' }
  );
}

