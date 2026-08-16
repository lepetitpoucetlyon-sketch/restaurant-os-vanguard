/**
 * LiveRecipeCostingService.ts
 * 
 * Moteur de calcul en direct du Food Cost, des coefficients multiplicateurs et de la marge brute des fiches techniques.
 * Invariants :
 * - Calculs stricts en centimes entiers / microunités (zéro flottant).
 * - Prise en compte du coefficient de perte / parage / réduction cuisson (Yield & Shrinkage).
 * - Support des sous-recettes (préparations intermédiaires).
 */

export interface RecipeIngredientLine {
  ingredientId: string;
  ingredientName: string;
  grossQuantity: number;        // Quantité brute en unité de base (ex: 0.200 kg)
  unitPumpCts: number;          // PUMP actuel en centimes par unité de base (ex: 2400 cts/kg)
  lossFactorPct?: number;       // % de perte au parage/épluchage/cuisson (ex: 10%)
}

export interface SubRecipeLine {
  subRecipeId: string;
  subRecipeName: string;
  portionsUsed: number;         // Nombre de portions de la sous-recette utilisées
  costPerPortionCts: number;    // Coût unitaire par portion de la sous-recette
}

export interface TechnicalSheetInput {
  id: string;
  name: string;
  category: string;
  portionsCount: number;        // Nombre de portions produites par la fiche (ex: 4)
  ingredients: RecipeIngredientLine[];
  subRecipes?: SubRecipeLine[];
  sellingPriceTtcCts: number;   // Prix de vente TTC affiché à la carte en centimes (ex: 2800 cts = 28,00 €)
  vatRatePct: 5.5 | 10.0 | 20.0;
}

export interface TechnicalSheetCostingResult {
  recipeId: string;
  recipeName: string;
  portionsCount: number;
  totalIngredientsCostCts: number;
  totalSubRecipesCostCts: number;
  totalRecipeCostCts: number;
  costPerPortionCts: number;     // Coût matière net par portion (Food Cost)
  sellingPriceHtCts: number;     // Prix de vente HT par portion
  marginHtCts: number;           // Marge brute HT par portion en centimes
  marginPct: number;             // Taux de marge brute HT en % (ex: 78.5%)
  foodCostRatioPct: number;      // Ratio Food Cost % (ex: 21.5%)
  multiplierCoefficient: number; // Coefficient multiplicateur (Prix TTC / Coût portion)
  isTargetMarginReached: boolean;// Ex: > 70% marge
}

export class LiveRecipeCostingService {
  /**
   * Calcule le coût matière complet d'une fiche technique et sa rentabilité carte.
   */
  public static computeCosting(
    recipe: TechnicalSheetInput,
    targetMarginPct = 70.0
  ): TechnicalSheetCostingResult {
    const portions = Math.max(1, recipe.portionsCount);

    let totalIngredientsCostCts = 0;
    for (const ing of recipe.ingredients) {
      const lossFactor = ing.lossFactorPct ?? 0;
      // Quantité réelle facturée = Quantité brute / (1 - perte)
      const effectiveQty = lossFactor > 0 && lossFactor < 100
        ? ing.grossQuantity / (1 - lossFactor / 100)
        : ing.grossQuantity;

      const lineCostCts = Math.round(effectiveQty * ing.unitPumpCts);
      totalIngredientsCostCts += lineCostCts;
    }

    let totalSubRecipesCostCts = 0;
    if (recipe.subRecipes && recipe.subRecipes.length > 0) {
      for (const sub of recipe.subRecipes) {
        totalSubRecipesCostCts += Math.round(sub.portionsUsed * sub.costPerPortionCts);
      }
    }

    const totalRecipeCostCts = totalIngredientsCostCts + totalSubRecipesCostCts;
    const costPerPortionCts = Math.round(totalRecipeCostCts / portions);

    // Prix de vente HT en centimes
    const sellingPriceHtCts = Math.round(
      (recipe.sellingPriceTtcCts / (1 + recipe.vatRatePct / 100))
    );

    const marginHtCts = sellingPriceHtCts - costPerPortionCts;
    const marginPct = sellingPriceHtCts > 0
      ? Number(((marginHtCts / sellingPriceHtCts) * 100).toFixed(2))
      : 0;

    const foodCostRatioPct = sellingPriceHtCts > 0
      ? Number(((costPerPortionCts / sellingPriceHtCts) * 100).toFixed(2))
      : 0;

    const multiplierCoefficient = costPerPortionCts > 0
      ? Number((recipe.sellingPriceTtcCts / costPerPortionCts).toFixed(2))
      : 0;

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      portionsCount: portions,
      totalIngredientsCostCts,
      totalSubRecipesCostCts,
      totalRecipeCostCts,
      costPerPortionCts,
      sellingPriceHtCts,
      marginHtCts,
      marginPct,
      foodCostRatioPct,
      multiplierCoefficient,
      isTargetMarginReached: marginPct >= targetMarginPct,
    };
  }

  /**
   * Simule en direct l'impact d'une fluctuation du prix d'un ingrédient sur la rentabilité de la recette.
   */
  public static simulatePriceChange(
    recipe: TechnicalSheetInput,
    ingredientId: string,
    newUnitPumpCts: number
  ): {
    current: TechnicalSheetCostingResult;
    simulated: TechnicalSheetCostingResult;
    portionCostDeltaCts: number;
    marginPctDelta: number;
  } {
    const current = this.computeCosting(recipe);

    const updatedIngredients = recipe.ingredients.map((ing) =>
      ing.ingredientId === ingredientId ? { ...ing, unitPumpCts: newUnitPumpCts } : ing
    );

    const simulated = this.computeCosting({
      ...recipe,
      ingredients: updatedIngredients,
    });

    const portionCostDeltaCts = simulated.costPerPortionCts - current.costPerPortionCts;
    const marginPctDelta = Number((simulated.marginPct - current.marginPct).toFixed(2));

    return {
      current,
      simulated,
      portionCostDeltaCts,
      marginPctDelta,
    };
  }
}
