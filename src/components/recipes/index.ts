'use client';

/**
 * src/components/recipes — Public API
 */

export { RecipeCostBadge } from './RecipeCostBadge';
export type { RecipeCostBadgeProps } from './RecipeCostBadge';

export { BarRecipeCard } from './BarRecipeCard';
export type { BarRecipeCardProps } from './BarRecipeCard';

export { DailyPrepList } from './DailyPrepList';
export type { DailyPrepListProps } from './DailyPrepList';

export {
  computeRecipeFoodCostInMu,
  recipeSalePriceInMu,
  foodCostPct,
  marginPct,
  minPriceForFoodCostTarget,
  scaleIngredient,
  smartQuantity,
  formatMicrounits,
  MICROUNITS_PER_EURO,
  MICROUNITS_PER_CENT,
} from './recipeUtils';
