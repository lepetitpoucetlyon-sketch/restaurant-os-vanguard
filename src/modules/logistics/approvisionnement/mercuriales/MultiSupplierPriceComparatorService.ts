/**
 * MultiSupplierPriceComparatorService.ts
 * 
 * Moteur de comparaison des mercuriales et d'optimisation des paniers d'achat multi-fournisseurs.
 * Invariants :
 * - Calculs stricts en centimes entiers (zéro flottant).
 * - Prise en compte des conditionnements d'achat et des seuils de Franco de port.
 */

import type {
  MercurialeItem,
  IngredientPriceComparisonRow,
  BasketOptimizationInput,
  OptimizedBasketResult,
  BaseUnit,
} from './MercurialeTypes';

export class MultiSupplierPriceComparatorService {
  /**
   * Compare les prix d'un ensemble d'ingrédients à travers plusieurs mercuriales fournisseurs.
   */
  public static compareIngredientPrices(
    ingredientNamesMap: Map<string, { name: string; baseUnit: BaseUnit }>,
    mercurialeItems: MercurialeItem[],
    suppliersMap: Map<string, string> // supplierId -> supplierName
  ): IngredientPriceComparisonRow[] {
    const groupedByIngredient = new Map<string, MercurialeItem[]>();

    for (const item of mercurialeItems) {
      if (!item.isAvailable) continue;
      const list = groupedByIngredient.get(item.ingredientId) || [];
      list.push(item);
      groupedByIngredient.set(item.ingredientId, list);
    }

    const rows: IngredientPriceComparisonRow[] = [];

    for (const [ingredientId, items] of groupedByIngredient.entries()) {
      if (items.length === 0) continue;

      const meta = ingredientNamesMap.get(ingredientId) || {
        name: items[0].name,
        baseUnit: items[0].packagingUnit,
      };

      // Trier par prix unitaire croissant
      const sorted = [...items].sort((a, b) => a.unitPriceHtCts - b.unitPriceHtCts);
      const bestPrice = sorted[0].unitPriceHtCts;
      const worstPrice = sorted[sorted.length - 1].unitPriceHtCts;
      const spreadPct = bestPrice > 0 
        ? Number((((worstPrice - bestPrice) / bestPrice) * 100).toFixed(2))
        : 0;

      const offers = sorted.map((item) => {
        const diffFromBestPct = bestPrice > 0
          ? Number((((item.unitPriceHtCts - bestPrice) / bestPrice) * 100).toFixed(2))
          : 0;

        return {
          supplierId: item.supplierId,
          supplierName: suppliersMap.get(item.supplierId) || item.supplierId,
          supplierRef: item.supplierRefCode,
          packagingLabel: item.packagingLabel,
          packagePriceHtCts: item.packagePriceHtCts,
          unitPriceHtCts: item.unitPriceHtCts,
          vatRatePct: item.vatRatePct,
          originCountry: item.originCountry,
          labels: item.labels,
          isCheapest: item.unitPriceHtCts === bestPrice,
          priceDifferencePctFromBest: diffFromBestPct,
        };
      });

      rows.push({
        ingredientId,
        ingredientName: meta.name,
        baseUnit: meta.baseUnit,
        offers,
        cheapestSupplierId: sorted[0].supplierId,
        bestUnitPriceHtCts: bestPrice,
        worstUnitPriceHtCts: worstPrice,
        spreadPct,
      });
    }

    return rows;
  }

  /**
   * Optimise la composition des paniers d'achat en sélectionnant le fournisseur le plus économique
   * tout en surveillant l'atteinte des Francos de port.
   */
  public static optimizeBaskets(input: BasketOptimizationInput): OptimizedBasketResult {
    const suppliersMap = new Map(input.suppliers.map((s) => [s.id, s]));
    const supplierBasketsMap = new Map<string, OptimizedBasketResult['supplierBaskets'][0]['items']>();

    for (const req of input.requiredIngredients) {
      // Trouver tous les articles disponibles pour cet ingrédient
      const candidates = input.mercurialeItems.filter(
        (m) => m.ingredientId === req.ingredientId && m.isAvailable && m.conversionFactorToBaseUnit > 0
      );

      if (candidates.length === 0) continue;

      // Trier par prix unitaire pour choisir le meilleur
      candidates.sort((a, b) => a.unitPriceHtCts - b.unitPriceHtCts);
      const chosen = candidates[0];

      // Calculer le nombre de colis nécessaires (arrondi supérieur)
      const packagesCount = Math.ceil(req.quantityInBaseUnit / chosen.conversionFactorToBaseUnit);
      const totalHtCts = packagesCount * chosen.packagePriceHtCts;
      const totalDeliveredQty = packagesCount * chosen.conversionFactorToBaseUnit;

      const basketItems = supplierBasketsMap.get(chosen.supplierId) || [];
      basketItems.push({
        ingredientId: req.ingredientId,
        mercurialeItemId: chosen.id,
        name: chosen.name,
        packagesCount,
        packagingLabel: chosen.packagingLabel,
        packagePriceHtCts: chosen.packagePriceHtCts,
        totalHtCts,
        totalDeliveredQty,
      });
      supplierBasketsMap.set(chosen.supplierId, basketItems);
    }

    let totalEstimatedCostCts = 0;
    const supplierBaskets: OptimizedBasketResult['supplierBaskets'] = [];

    for (const [supplierId, items] of supplierBasketsMap.entries()) {
      const supplierInfo = suppliersMap.get(supplierId);
      const basketTotalHtCts = items.reduce((sum, item) => sum + item.totalHtCts, 0);
      const francoCts = supplierInfo?.francoCts || 0;
      const isFrancoReached = basketTotalHtCts >= francoCts;
      const shippingCostCts = isFrancoReached ? 0 : (supplierInfo?.shippingCostCts || 0);
      const totalWithShippingCts = basketTotalHtCts + shippingCostCts;

      totalEstimatedCostCts += totalWithShippingCts;

      supplierBaskets.push({
        supplierId,
        supplierName: supplierInfo?.name || supplierId,
        items,
        basketTotalHtCts,
        francoCts,
        isFrancoReached,
        shippingCostCts,
        totalWithShippingCts,
      });
    }

    return {
      totalEstimatedCostCts,
      supplierBaskets,
      savingsComparedToSingleSupplierCts: 0, // Optionnel : calcul d'économie relative
    };
  }
}
