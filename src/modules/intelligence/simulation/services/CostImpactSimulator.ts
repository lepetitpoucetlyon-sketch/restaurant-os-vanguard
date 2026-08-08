import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface DishSimulationItem {
  dishId: string;
  dishName: string;
  currentCostInMicrounits: number;
  sellingPriceInMicrounits: number;
}

export interface SimulationResult {
  dishId: string;
  dishName: string;
  newCostInMicrounits: number;
  newMarginPercentage: number;
  multiplierRatio: number; // SellingPrice / NewCost
  isBelowTarget: boolean; // if multiplier < 3.5
}

/**
 * 🧮 CostImpactSimulator (Item 8.2)
 * Simulateur d'impact de hausse des prix matières premières en direct.
 * Simule l'effet d'une hausse d'un ingrédient (+X%) sur l'ensemble de la carte et alerte si le coefficient multiplicateur descend sous 3.5.
 */
export class CostImpactSimulator {
  static simulateIngredientPriceIncrease(
    dishes: DishSimulationItem[],
    ingredientIncreasePercentage: number
  ): SimulationResult[] {
    const multiplier = 1 + ingredientIncreasePercentage / 100;

    return dishes.map(dish => {
      const newCost = Math.round(dish.currentCostInMicrounits * multiplier);
      const margin = dish.sellingPriceInMicrounits - newCost;
      const marginPct = dish.sellingPriceInMicrounits > 0
        ? Math.round((margin / dish.sellingPriceInMicrounits) * 100)
        : 0;

      const ratio = newCost > 0
        ? Number((dish.sellingPriceInMicrounits / newCost).toFixed(2))
        : 0;

      const isBelowTarget = ratio < 3.5;

      if (isBelowTarget) {
        logger.warn(`[CostImpactSimulator] Plat "${dish.dishName}" passe sous le coef cible de 3.5 (Coef actuel: ${ratio})`);
        empireAudit.log({
          module: 'ops',
          action: 'DISH_MARGIN_BELOW_TARGET',
          details: { dishId: dish.dishId, dishName: dish.dishName, ratio, marginPct },
          severity: 'medium',
          timestamp: new Date(),
        });
      }

      return {
        dishId: dish.dishId,
        dishName: dish.dishName,
        newCostInMicrounits: newCost,
        newMarginPercentage: marginPct,
        multiplierRatio: ratio,
        isBelowTarget,
      };
    });
  }
}
