import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { Recipe } from '@shared/nexus/contracts/logistics';
import { deductStockItem } from './StockDeductionHandler';

export interface PendingStockDeduction {
  id: string;
  tenantId: string;
  orderId: string;
  productId: string;
  productName?: string;
  quantity: number;
  soldAt: string;
  businessDay?: string;
  status: 'pending' | 'reconciled' | 'cancelled';
  reconciledRecipeId?: string;
  reconciledAt?: string;
  createdAt: string;
}

/**
 * RecipeReconciliationHandler (Lot 2 - M2)
 * Écoute `recipe.created` et `recipe.updated`.
 * Dès qu'une fiche technique est créée ou mise à jour, ce handler rattrape
 * toutes les ventes passées du produit restées en attente de déstockage.
 */
export function registerRecipeReconciliationHandler(): () => void {
  const handleRecipeChange = async ({
    tenantId,
    productId,
    recipeId,
  }: {
    tenantId: string;
    productId: string;
    recipeId: string;
  }) => {
    // 1. Lire la recette et ses ingrédients
    const recipe = await Nexus.adapter.get<Recipe>(`tenants/${tenantId}/recipes/${recipeId}`);
    if (!recipe?.ingredients?.length) {
      logger.info(`[RecipeReconciliation] Recette ${recipeId} sans ingrédients, pas de réconciliation possible.`);
      return;
    }

    // 2. Chercher les déductions orphelines en attente pour ce produit
    const pendingDeductions = await Nexus.adapter.query<PendingStockDeduction>(
      `tenants/${tenantId}/pending_stock_deductions`,
      {
        where: [
          { field: 'productId', operator: '==', value: productId },
          { field: 'status', operator: '==', value: 'pending' },
        ],
      }
    );

    if (!pendingDeductions || pendingDeductions.length === 0) {
      return;
    }

    logger.info(
      `[RecipeReconciliation] Rapprochement rétroactif de ${pendingDeductions.length} déduction(s) en attente pour productId=${productId} via recette=${recipeId}`
    );

    let reconciledCount = 0;

    for (const deduction of pendingDeductions) {
      // Déduire chaque ingrédient d'après la nouvelle recette et la quantité vendue
      for (const ing of recipe.ingredients) {
        if (!ing.ingredientId) continue;
        const deductQty = ing.quantity * deduction.quantity;
        await deductStockItem(tenantId, ing.ingredientId, deductQty, ing.name ?? ing.ingredientId);
      }

      // Marquer la déduction comme réconciliée avec traçabilité
      await Nexus.adapter.update(`tenants/${tenantId}/pending_stock_deductions/${deduction.id}`, {
        status: 'reconciled',
        reconciledRecipeId: recipeId,
        reconciledAt: new Date().toISOString(),
      });

      reconciledCount++;
    }

    empireAudit.log({
      module: 'inventory',
      action: 'RECIPE_DEDUCTIONS_RECONCILED',
      details: {
        productId,
        recipeId,
        reconciledCount,
      },
      severity: 'medium',
      timestamp: new Date(),
    });

    await NexusEventBus.emitDurable('stock.deductions_reconciled', {
      v: 1,
      tenantId,
      productId,
      recipeId,
      reconciledCount,
    });
  };

  const unsubCreated = NexusEventBus.on(
    'recipe.created',
    handleRecipeChange,
    { id: 'recipe-reconciliation-created', priority: 'HIGH' }
  );

  const unsubUpdated = NexusEventBus.on(
    'recipe.updated',
    handleRecipeChange,
    { id: 'recipe-reconciliation-updated', priority: 'HIGH' }
  );

  return () => {
    unsubCreated();
    unsubUpdated();
  };
}
