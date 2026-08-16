/**
 * PriceDriftDetectorService.ts
 * 
 * Moteur de détection des Dérives Tarifaires Mercuriales Fournisseurs.
 * Invariant : Alerter en temps réel dès qu'une hausse de prix unitaire d'achat dépasse le seuil critique (+5%)
 * et recalculer immédiatement l'impact sur le Food Cost (%) des fiches techniques associées.
 */

export interface InvoiceItemEntry {
  ingredientId: string;
  name: string;
  unit: string; // 'kg', 'l', 'unit'
  newUnitPriceCts: number;
  quantity: number;
  supplierId: string;
}

export interface HistoricalPriceRecord {
  ingredientId: string;
  lastUnitPriceCts: number;
  lastInvoiceDateUtc: number;
  supplierId: string;
}

export interface LinkedRecipeInfo {
  recipeId: string;
  recipeName: string;
  sellingPriceTtcCts: number;
  currentCostCts: number;
  ingredientQuantityUsed: number;
}

export interface IngredientDriftReport {
  ingredientId: string;
  name: string;
  supplierId: string;
  oldPriceCts: number;
  newPriceCts: number;
  diffCts: number;
  driftPercentage: number;
  isAlertTriggered: boolean;
  impactedRecipes: Array<{
    recipeId: string;
    recipeName: string;
    oldFoodCostPct: number;
    newFoodCostPct: number;
    deltaMarginPct: number;
  }>;
}

export interface BatchDriftAnalysisResult {
  hasCriticalDrifts: boolean;
  analyzedItemsCount: number;
  flaggedItemsCount: number;
  drifts: IngredientDriftReport[];
}

export class PriceDriftDetectorService {
  public static readonly DEFAULT_ALERT_THRESHOLD_PCT = 5.0; // Alerte si hausse > 5%

  /**
   * Analyse une liste d'articles de facture par rapport aux mercuriales historiques.
   */
  public static analyzeInvoiceItems(
    items: InvoiceItemEntry[],
    historicalPrices: Map<string, HistoricalPriceRecord>,
    linkedRecipesMap?: Map<string, LinkedRecipeInfo[]>,
    alertThresholdPct: number = this.DEFAULT_ALERT_THRESHOLD_PCT
  ): BatchDriftAnalysisResult {
    const drifts: IngredientDriftReport[] = [];
    let flaggedCount = 0;

    for (const item of items) {
      const history = historicalPrices.get(item.ingredientId);
      if (!history || history.lastUnitPriceCts <= 0) {
        // Premier achat ou absence d'historique fiable
        continue;
      }

      const oldPrice = history.lastUnitPriceCts;
      const newPrice = item.newUnitPriceCts;
      const diffCts = newPrice - oldPrice;
      const driftPercentage = Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(2));
      const isAlertTriggered = driftPercentage >= alertThresholdPct;

      if (isAlertTriggered) {
        flaggedCount++;
      }

      const recipes = linkedRecipesMap?.get(item.ingredientId) || [];
      const impactedRecipes = recipes.map((recipe) => {
        const costDiffForRecipe = Math.round(diffCts * recipe.ingredientQuantityUsed);
        const oldFoodCostPct = Number(((recipe.currentCostCts / recipe.sellingPriceTtcCts) * 100).toFixed(2));
        const newCostCts = recipe.currentCostCts + costDiffForRecipe;
        const newFoodCostPct = Number(((newCostCts / recipe.sellingPriceTtcCts) * 100).toFixed(2));
        const deltaMarginPct = Number((newFoodCostPct - oldFoodCostPct).toFixed(2));

        return {
          recipeId: recipe.recipeId,
          recipeName: recipe.recipeName,
          oldFoodCostPct,
          newFoodCostPct,
          deltaMarginPct,
        };
      });

      drifts.push({
        ingredientId: item.ingredientId,
        name: item.name,
        supplierId: item.supplierId,
        oldPriceCts: oldPrice,
        newPriceCts: newPrice,
        diffCts,
        driftPercentage,
        isAlertTriggered,
        impactedRecipes,
      });
    }

    return {
      hasCriticalDrifts: flaggedCount > 0,
      analyzedItemsCount: items.length,
      flaggedItemsCount: flaggedCount,
      drifts,
    };
  }
}
