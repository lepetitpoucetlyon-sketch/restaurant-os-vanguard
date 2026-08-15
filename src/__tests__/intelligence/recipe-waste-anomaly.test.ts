import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RecipeWasteAnomalyDetector,
  type DishRecipe,
  type SoldDishCount,
  type ActualIngredientUsage,
} from '@/modules/intelligence/forecasting/RecipeWasteAnomalyDetector';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('Intelligence & Anti-Gaspillage : Détection d Anomalies Recettes (Food Cost)', () => {
  const tenantId = 'burger-house-paris';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait détecter un coulage critique sur la viande de bœuf (sur-portionnage / perte)', async () => {
    const faultSpy = vi.fn();
    NexusEventBus.on('facility.hardware_fault', faultSpy, { id: 'test-waste-fault' });

    const recipes: DishRecipe[] = [
      {
        productId: 'prod-cheeseburger',
        productName: 'Cheese Burger Classic',
        ingredients: [
          {
            ingredientId: 'ing-beef-mince',
            name: 'Bœuf Haché Frais VBF',
            unit: 'kg',
            quantityPerPortion: 0.18, // 180g
          },
          {
            ingredientId: 'ing-cheddar-slice',
            name: 'Cheddar Mature Tranche',
            unit: 'kg',
            quantityPerPortion: 0.04, // 40g (2 tranches)
          },
        ],
      },
    ];

    // 100 Burgers vendus sur la journée
    const sales: SoldDishCount[] = [
      {
        productId: 'prod-cheeseburger',
        quantitySold: 100,
      },
    ];

    // Constat d'inventaire : 24 kg de bœuf consommés au lieu de 18 kg (+33.3% / 6kg de perte à 16€/kg = 96€)
    // Cheddar : 4.1 kg consommé au lieu de 4.0 kg (+2.5% = Nominal)
    const actualUsage: ActualIngredientUsage[] = [
      {
        ingredientId: 'ing-beef-mince',
        actualQuantityUsed: 24.0,
        unitCostInMicrounits: 16000000, // 16.00 € / kg
      },
      {
        ingredientId: 'ing-cheddar-slice',
        actualQuantityUsed: 4.1,
        unitCostInMicrounits: 12000000, // 12.00 € / kg
      },
    ];

    const result = await RecipeWasteAnomalyDetector.analyzeTheoreticalVsActualWaste(
      tenantId,
      '2026-08-15',
      recipes,
      sales,
      actualUsage
    );

    expect(result.anomaliesDetectedCount).toBe(1);
    expect(result.criticalLeakCount).toBe(1);
    expect(result.totalFinancialLossInMicrounits).toBeGreaterThanOrEqual(96000000); // ~96 €

    const beefReport = result.ingredientReports.find((r) => r.ingredientId === 'ing-beef-mince');
    expect(beefReport?.theoreticalQuantity).toBe(18.0);
    expect(beefReport?.varianceQuantity).toBe(6.0);
    expect(beefReport?.severity).toBe('CRITICAL_LEAK');
    expect(beefReport?.anomalyHypothesis).toBe('OVER_PORTIONING');

    const cheddarReport = result.ingredientReports.find((r) => r.ingredientId === 'ing-cheddar-slice');
    expect(cheddarReport?.severity).toBe('NOMINAL');

    expect(faultSpy).toHaveBeenCalledTimes(1);
  });
});
