import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface IngredientSubstitutionRule {
  missingIngredientId: string;
  substituteIngredientId: string;
  substituteName: string;
  conversionRatio: number; // ex: 1 kg beurre AOP = 1.0 kg beurre standard
  substituteUnitPriceInMicrounits: number;
}

export interface DishSubstitutionRequest {
  dishId: string;
  dishName: string;
  missingIngredientId: string;
  originalPortionCostInMicrounits: number;
  originalIngredientCostInMicrounits: number;
  rules: IngredientSubstitutionRule[];
}

export interface SubstitutionResult {
  dishId: string;
  canSubstitute: boolean;
  chosenSubstituteId?: string;
  chosenSubstituteName?: string;
  newPortionCostInMicrounits: number;
  costDifferenceInMicrounits: number;
}

/**
 * SelfHealingRecipeBomService — Angle mort L73.
 * Propose automatiquement une substitution d'ingrédient de secours lors d'une rupture et recalcule instantanément le coût portion BOM.
 */
export class SelfHealingRecipeBomService {
  static applyHealingSubstitution(
    tenantId: string,
    req: DishSubstitutionRequest
  ): SubstitutionResult {
    const match = req.rules.find(r => r.missingIngredientId === req.missingIngredientId);

    if (!match) {
      return {
        dishId: req.dishId,
        canSubstitute: false,
        newPortionCostInMicrounits: req.originalPortionCostInMicrounits,
        costDifferenceInMicrounits: 0,
      };
    }

    const substituteCostInMicrounits = Math.round(match.substituteUnitPriceInMicrounits * match.conversionRatio);
    const costDiff = substituteCostInMicrounits - req.originalIngredientCostInMicrounits;
    const newPortionCostInMicrounits = req.originalPortionCostInMicrounits + costDiff;

    NexusEventBus.emit('production.self_healing_recipe_substituted', {
      v: 1,
      tenantId,
      dishId: req.dishId,
      missingIngredientId: req.missingIngredientId,
      substituteIngredientId: match.substituteIngredientId,
      portionCostDiffInMicrounits: costDiff,
      substitutedAt: Date.now(),
    });

    return {
      dishId: req.dishId,
      canSubstitute: true,
      chosenSubstituteId: match.substituteIngredientId,
      chosenSubstituteName: match.substituteName,
      newPortionCostInMicrounits,
      costDifferenceInMicrounits: costDiff,
    };
  }
}
