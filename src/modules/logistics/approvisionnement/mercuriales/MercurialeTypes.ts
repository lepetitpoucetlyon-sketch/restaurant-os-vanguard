/**
 * MercurialeTypes.ts
 * 
 * Modèle pour les mercuriales fournisseurs, conditionnements et comparaisons de prix.
 */

export type BaseUnit = 'kg' | 'l' | 'unit' | 'portion';

export interface MercurialeItem {
  id: string;
  supplierId: string;
  ingredientId: string;
  supplierRefCode: string;
  name: string;
  packagingLabel: string; // ex: "Carton 6x1kg", "Sac 25kg", "Bouteille 75cl", "Colis 5kg"
  packagingQuantity: number; // ex: 6
  packagingUnit: BaseUnit;   // 'kg'
  conversionFactorToBaseUnit: number; // Quantité totale en unité de base (ex: 6 pour 6kg, 25 pour 25kg, 0.75 pour 75cl)
  packagePriceHtCts: number; // Prix du colis en centimes (ex: 5400 cts = 54,00 €)
  unitPriceHtCts: number;    // Prix ramené à l'unité de base (ex: 5400 / 6 = 900 cts = 9,00 €/kg)
  vatRatePct: 5.5 | 10.0 | 20.0 | 0.0;
  originCountry?: string;    // ex: "France", "Espagne"
  labels?: string[];         // ex: ["AOP", "Bio", "Label Rouge", "Pêche Durable"]
  validFromUtc: number;
  validToUtc?: number;
  isAvailable: boolean;
}

export interface IngredientPriceComparisonRow {
  ingredientId: string;
  ingredientName: string;
  baseUnit: BaseUnit;
  offers: Array<{
    supplierId: string;
    supplierName: string;
    supplierRef: string;
    packagingLabel: string;
    packagePriceHtCts: number;
    unitPriceHtCts: number;
    vatRatePct: number;
    originCountry?: string;
    labels?: string[];
    isCheapest: boolean;
    priceDifferencePctFromBest: number;
  }>;
  cheapestSupplierId: string;
  bestUnitPriceHtCts: number;
  worstUnitPriceHtCts: number;
  spreadPct: number; // Écart de prix max en %
}

export interface BasketOptimizationInput {
  requiredIngredients: Array<{
    ingredientId: string;
    quantityInBaseUnit: number;
  }>;
  mercurialeItems: MercurialeItem[];
  suppliers: Array<{
    id: string;
    name: string;
    francoCts: number;
    shippingCostCts: number;
  }>;
}

export interface OptimizedBasketResult {
  totalEstimatedCostCts: number;
  supplierBaskets: Array<{
    supplierId: string;
    supplierName: string;
    items: Array<{
      ingredientId: string;
      mercurialeItemId: string;
      name: string;
      packagesCount: number;
      packagingLabel: string;
      packagePriceHtCts: number;
      totalHtCts: number;
      totalDeliveredQty: number;
    }>;
    basketTotalHtCts: number;
    francoCts: number;
    isFrancoReached: boolean;
    shippingCostCts: number;
    totalWithShippingCts: number;
  }>;
  savingsComparedToSingleSupplierCts: number;
}
