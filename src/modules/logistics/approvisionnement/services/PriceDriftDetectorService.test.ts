import { describe, it, expect } from 'vitest';
import { 
  PriceDriftDetectorService, 
  type InvoiceItemEntry, 
  type HistoricalPriceRecord, 
  type LinkedRecipeInfo 
} from './PriceDriftDetectorService';

describe('PriceDriftDetectorService', () => {
  it('detects critical price increase (> 5%) and calculates recipe food cost impact', () => {
    const invoiceItems: InvoiceItemEntry[] = [
      {
        ingredientId: 'ing-beurre',
        name: 'Beurre Doux 82% MG 1kg',
        unit: 'kg',
        newUnitPriceCts: 920, // 9.20 € (was 8.00 € -> +15.00%)
        quantity: 10,
        supplierId: 'supp-transgourmet',
      },
    ];

    const history = new Map<string, HistoricalPriceRecord>([
      ['ing-beurre', { ingredientId: 'ing-beurre', lastUnitPriceCts: 800, lastInvoiceDateUtc: Date.now() - 86400000, supplierId: 'supp-transgourmet' }],
    ]);

    const linkedRecipes = new Map<string, LinkedRecipeInfo[]>([
      [
        'ing-beurre',
        [
          {
            recipeId: 'rec-croissant',
            recipeName: 'Croissant Beurre AOP',
            sellingPriceTtcCts: 180, // 1.80 €
            currentCostCts: 45, // 0.45 € (25.00% food cost)
            ingredientQuantityUsed: 0.05, // 50g de beurre par croissant
          },
        ],
      ],
    ]);

    const result = PriceDriftDetectorService.analyzeInvoiceItems(invoiceItems, history, linkedRecipes);

    expect(result.hasCriticalDrifts).toBe(true);
    expect(result.flaggedItemsCount).toBe(1);

    const drift = result.drifts[0];
    expect(drift.driftPercentage).toBe(15.00);
    expect(drift.isAlertTriggered).toBe(true);
    expect(drift.diffCts).toBe(120);

    const recipeImpact = drift.impactedRecipes[0];
    expect(recipeImpact.recipeName).toBe('Croissant Beurre AOP');
    expect(recipeImpact.oldFoodCostPct).toBe(25.00);
    expect(recipeImpact.newFoodCostPct).toBeGreaterThan(25.00);
  });

  it('ignores minor price fluctuations below threshold', () => {
    const invoiceItems: InvoiceItemEntry[] = [
      {
        ingredientId: 'ing-farine',
        name: 'Farine T55 25kg',
        unit: 'kg',
        newUnitPriceCts: 102, // 1.02 € (was 1.00 € -> +2.00% <= 5%)
        quantity: 4,
        supplierId: 'supp-moulins',
      },
    ];

    const history = new Map<string, HistoricalPriceRecord>([
      ['ing-farine', { ingredientId: 'ing-farine', lastUnitPriceCts: 100, lastInvoiceDateUtc: Date.now() - 86400000, supplierId: 'supp-moulins' }],
    ]);

    const result = PriceDriftDetectorService.analyzeInvoiceItems(invoiceItems, history);

    expect(result.hasCriticalDrifts).toBe(false);
    expect(result.flaggedItemsCount).toBe(0);
    expect(result.drifts[0].isAlertTriggered).toBe(false);
  });
});
