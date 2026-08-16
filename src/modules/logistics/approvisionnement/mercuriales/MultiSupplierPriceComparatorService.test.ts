import { describe, it, expect } from 'vitest';
import { MultiSupplierPriceComparatorService } from './MultiSupplierPriceComparatorService';
import type { MercurialeItem, BasketOptimizationInput, BaseUnit } from './MercurialeTypes';

describe('MultiSupplierPriceComparatorService', () => {
  const sampleMercuriales: MercurialeItem[] = [
    {
      id: 'm1',
      supplierId: 'supp-transgourmet',
      ingredientId: 'ing-beurre',
      supplierRefCode: 'TG-1029',
      name: 'Beurre Doux 82% MG',
      packagingLabel: 'Carton 10x1kg',
      packagingQuantity: 10,
      packagingUnit: 'kg',
      conversionFactorToBaseUnit: 10,
      packagePriceHtCts: 8800, // 8.80 €/kg (880 cts)
      unitPriceHtCts: 880,
      vatRatePct: 5.5,
      isAvailable: true,
      validFromUtc: Date.now(),
    },
    {
      id: 'm2',
      supplierId: 'supp-metro',
      ingredientId: 'ing-beurre',
      supplierRefCode: 'MET-884',
      name: 'Beurre Gastronomique',
      packagingLabel: 'Plaque 2.5kg',
      packagingQuantity: 1,
      packagingUnit: 'kg',
      conversionFactorToBaseUnit: 2.5,
      packagePriceHtCts: 2300, // 9.20 €/kg (920 cts)
      unitPriceHtCts: 920,
      vatRatePct: 5.5,
      isAvailable: true,
      validFromUtc: Date.now(),
    },
    {
      id: 'm3',
      supplierId: 'supp-pomona',
      ingredientId: 'ing-beurre',
      supplierRefCode: 'POM-440',
      name: 'Beurre Extra-Fin',
      packagingLabel: 'Carton 5x1kg',
      packagingQuantity: 5,
      packagingUnit: 'kg',
      conversionFactorToBaseUnit: 5,
      packagePriceHtCts: 4750, // 9.50 €/kg (950 cts)
      unitPriceHtCts: 950,
      vatRatePct: 5.5,
      isAvailable: true,
      validFromUtc: Date.now(),
    },
  ];

  it('compares ingredient prices across suppliers and determines the cheapest', () => {
    const metaMap = new Map<string, { name: string; baseUnit: BaseUnit }>([
      ['ing-beurre', { name: 'Beurre Doux', baseUnit: 'kg' }],
    ]);
    const suppliersMap = new Map([
      ['supp-transgourmet', 'Transgourmet'],
      ['supp-metro', 'Metro Cash & Carry'],
      ['supp-pomona', 'Pomona TerreAzur'],
    ]);

    const result = MultiSupplierPriceComparatorService.compareIngredientPrices(
      metaMap,
      sampleMercuriales,
      suppliersMap
    );

    expect(result).toHaveLength(1);
    const row = result[0];
    expect(row.ingredientId).toBe('ing-beurre');
    expect(row.cheapestSupplierId).toBe('supp-transgourmet');
    expect(row.bestUnitPriceHtCts).toBe(880);
    expect(row.worstUnitPriceHtCts).toBe(950);
    expect(row.spreadPct).toBeCloseTo(7.95, 1);
    expect(row.offers[0].isCheapest).toBe(true);
    expect(row.offers[1].priceDifferencePctFromBest).toBeGreaterThan(0);
  });

  it('optimizes supplier baskets and checks franco de port', () => {
    const input: BasketOptimizationInput = {
      requiredIngredients: [
        { ingredientId: 'ing-beurre', quantityInBaseUnit: 25 }, // 25kg need 3 cartons of 10kg from Transgourmet
      ],
      mercurialeItems: sampleMercuriales,
      suppliers: [
        { id: 'supp-transgourmet', name: 'Transgourmet', francoCts: 25000, shippingCostCts: 2500 }, // Franco 250€
      ],
    };

    const optimized = MultiSupplierPriceComparatorService.optimizeBaskets(input);

    expect(optimized.supplierBaskets).toHaveLength(1);
    const tgBasket = optimized.supplierBaskets[0];
    expect(tgBasket.supplierId).toBe('supp-transgourmet');
    expect(tgBasket.items[0].packagesCount).toBe(3); // 3x 10kg = 30kg >= 25kg
    expect(tgBasket.basketTotalHtCts).toBe(26400); // 3 * 8800 = 264.00 €
    expect(tgBasket.isFrancoReached).toBe(true); // 264€ >= 250€ franco
    expect(tgBasket.shippingCostCts).toBe(0);
    expect(tgBasket.totalWithShippingCts).toBe(26400);
  });
});
