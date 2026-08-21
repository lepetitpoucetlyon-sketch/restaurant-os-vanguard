export interface RecipeIngredientPortion {
  ingredientId: string;
  ingredientName: string;
  quantityRequired: number; // ex: 0.180 kg ou 2 unités
  unitPriceInMicrounits: number; // Prix d'achat live mercuriale
}

export interface DishRecipeSpec {
  dishId: string;
  dishName: string;
  sellingPriceTtcInMicrounits: number;
  taxRate: string; // '0.10'
  targetFoodCostRatioPct?: number; // Target ratio ex: 28%
  ingredients: RecipeIngredientPortion[];
}

export interface DishCostAnalysis {
  dishId: string;
  dishName: string;
  sellingPriceTtcInMicrounits: number;
  sellingPriceHtInMicrounits: number;
  foodCostInMicrounits: number;
  grossMarginInMicrounits: number;
  foodCostRatioPct: number;
  isFoodCostProfitable: boolean;
}

/**
 * RecipeBOMCostService — Angle mort B3.
 * Calcule le coût portion recette (BOM - Bill of Materials) en temps réel basé sur le cours des ingrédients en mercuriale et alerte sur la rentabilité.
 */
export class RecipeBOMCostService {
  static computeDishFoodCost(spec: DishRecipeSpec): DishCostAnalysis {
    const rateNum = parseFloat(spec.taxRate);
    const sellingPriceHtInMicrounits = Math.round(spec.sellingPriceTtcInMicrounits / (1 + rateNum));

    let foodCostInMicrounits = 0;
    for (const ing of spec.ingredients) {
      foodCostInMicrounits += Math.round(ing.quantityRequired * ing.unitPriceInMicrounits);
    }

    const grossMarginInMicrounits = sellingPriceHtInMicrounits - foodCostInMicrounits;
    const foodCostRatioPct = sellingPriceHtInMicrounits > 0
      ? Math.round((foodCostInMicrounits / sellingPriceHtInMicrounits) * 1000) / 10
      : 100;

    const targetRatio = spec.targetFoodCostRatioPct ?? 30.0;
    const isFoodCostProfitable = foodCostRatioPct <= targetRatio;

    return {
      dishId: spec.dishId,
      dishName: spec.dishName,
      sellingPriceTtcInMicrounits: spec.sellingPriceTtcInMicrounits,
      sellingPriceHtInMicrounits,
      foodCostInMicrounits,
      grossMarginInMicrounits,
      foodCostRatioPct,
      isFoodCostProfitable,
    };
  }
}
