import { describe, it, expect } from 'vitest';
import { LiveRecipeCostingService, TechnicalSheetInput } from './LiveRecipeCostingService';

describe('LiveRecipeCostingService', () => {
  const sampleRecipe: TechnicalSheetInput = {
    id: 'rec-boeuf-bourguignon',
    name: 'Boeuf Bourguignon Traditionnel',
    category: 'Plats Chauds',
    portionsCount: 4,
    ingredients: [
      {
        ingredientId: 'ing-paleron',
        ingredientName: 'Paleron de Boeuf',
        grossQuantity: 0.8, // 800g pour 4 portions (200g/port)
        unitPumpCts: 1400, // 14.00 €/kg (1400 cts) -> 11.20 €
        lossFactorPct: 10, // 10% de parage -> 0.8 / 0.9 = ~0.8888 kg -> 12.44 € (1244 cts)
      },
      {
        ingredientId: 'ing-carotte',
        ingredientName: 'Carottes des Sables',
        grossQuantity: 0.4, // 400g
        unitPumpCts: 180, // 1.80 €/kg -> 0.72 € (72 cts)
      },
    ],
    subRecipes: [
      {
        subRecipeId: 'sub-fond-brun',
        subRecipeName: 'Fond Brun Lié Maison',
        portionsUsed: 4,
        costPerPortionCts: 85, // 0.85 € / portion -> 3.40 € (340 cts)
      },
    ],
    sellingPriceTtcCts: 2600, // 26.00 € TTC à la carte
    vatRatePct: 10.0, // TVA 10% -> Prix HT = 26.00 / 1.10 = 23.64 € (2364 cts)
  };

  it('computes total recipe cost, portion cost, margins and multiplier coefficient', () => {
    const result = LiveRecipeCostingService.computeCosting(sampleRecipe);

    expect(result.recipeId).toBe('rec-boeuf-bourguignon');
    expect(result.portionsCount).toBe(4);
    expect(result.totalSubRecipesCostCts).toBe(340); // 4 * 85 cts
    expect(result.costPerPortionCts).toBeGreaterThan(300);
    expect(result.sellingPriceHtCts).toBe(2364); // 2600 / 1.10 = 2364 cts
    expect(result.marginPct).toBeGreaterThan(70); // Belle marge > 70%
    expect(result.multiplierCoefficient).toBeGreaterThan(5.0);
    expect(result.isTargetMarginReached).toBe(true);
  });

  it('simulates the impact of raw meat price inflation in real-time', () => {
    // Le paleron passe de 14.00 €/kg à 18.00 €/kg (1800 cts)
    const sim = LiveRecipeCostingService.simulatePriceChange(
      sampleRecipe,
      'ing-paleron',
      1800
    );

    expect(sim.portionCostDeltaCts).toBeGreaterThan(0); // Le coût portion augmente
    expect(sim.marginPctDelta).toBeLessThan(0); // Le taux de marge diminue
    expect(sim.simulated.costPerPortionCts).toBeGreaterThan(sim.current.costPerPortionCts);
  });
});
