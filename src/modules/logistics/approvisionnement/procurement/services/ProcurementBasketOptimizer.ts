import type { MercurialeItem } from '../../mercuriales/MercurialeTypes';
import type { SupplierEntity } from '../../core/domain/supplier.types';
import type { RestockItemRecommendation, SupplierBasketDraft } from '../types';

export interface BasketsOptimizationResult {
  supplierBaskets: SupplierBasketDraft[];
  grandTotalHtCts: number;
  estimatedShippingSavingsCts: number;
}

export class ProcurementBasketOptimizer {
  /**
   * Regroupe les recommandations par fournisseur et optimise les paniers avec les règles de Franco.
   */
  public static optimizeBaskets(
    itemsToRestock: RestockItemRecommendation[],
    suppliersMap: Map<string, SupplierEntity>,
    mercurialeItems: MercurialeItem[]
  ): BasketsOptimizationResult {
    const basketsBySupplier = new Map<string, RestockItemRecommendation[]>();
    for (const rec of itemsToRestock) {
      const list = basketsBySupplier.get(rec.selectedSupplierId) || [];
      list.push(rec);
      basketsBySupplier.set(rec.selectedSupplierId, list);
    }

    const supplierBaskets: SupplierBasketDraft[] = [];
    let grandTotalHtCts = 0;
    let estimatedShippingSavingsCts = 0;

    for (const [supplierId, items] of basketsBySupplier.entries()) {
      const supplier = suppliersMap.get(supplierId);
      const supplierName = supplier?.name || items[0]?.selectedSupplierName || 'Grossiste';
      const francoCts = supplier?.francoCts || 15000; // Défaut : 150.00 €
      const shippingCostCts = supplier?.shippingCostCts || 2500; // Défaut : 25.00 €

      const basketTotalHtCts = items.reduce((sum, i) => sum + i.totalHtCts, 0);
      const isFrancoReached = basketTotalHtCts >= francoCts;
      const amountToFrancoCts = isFrancoReached ? 0 : francoCts - basketTotalHtCts;
      const totalWithShippingCts = isFrancoReached ? basketTotalHtCts : basketTotalHtCts + shippingCostCts;

      grandTotalHtCts += totalWithShippingCts;
      if (isFrancoReached) {
        estimatedShippingSavingsCts += shippingCostCts;
      }

      const suggestedFrancoFillers = this.calculateFrancoFillers(
        supplierId,
        items,
        mercurialeItems,
        isFrancoReached,
        amountToFrancoCts,
        shippingCostCts
      );

      supplierBaskets.push({
        supplierId,
        supplierName,
        items,
        basketTotalHtCts,
        francoCts,
        shippingCostCts,
        isFrancoReached,
        amountToFrancoCts,
        totalWithShippingCts,
        suggestedFrancoFillers,
      });
    }

    return {
      supplierBaskets,
      grandTotalHtCts,
      estimatedShippingSavingsCts,
    };
  }

  private static calculateFrancoFillers(
    supplierId: string,
    currentItems: RestockItemRecommendation[],
    mercurialeItems: MercurialeItem[],
    isFrancoReached: boolean,
    amountToFrancoCts: number,
    shippingCostCts: number
  ): SupplierBasketDraft['suggestedFrancoFillers'] {
    if (isFrancoReached || amountToFrancoCts <= 0) {
      return [];
    }

    const allSupplierMercuriales = mercurialeItems.filter(
      (m) => m.supplierId === supplierId && m.isAvailable && !currentItems.some((it) => it.mercurialeItemId === m.id)
    );

    const fillers: SupplierBasketDraft['suggestedFrancoFillers'] = [];
    for (const filler of allSupplierMercuriales.slice(0, 3)) {
      if (filler.packagePriceHtCts <= 0) continue;
      const countToReachFranco = Math.ceil(amountToFrancoCts / filler.packagePriceHtCts);
      fillers.push({
        mercurialeItemId: filler.id,
        name: filler.name,
        packagingLabel: filler.packagingLabel,
        packagePriceHtCts: filler.packagePriceHtCts,
        suggestedPackagesCount: countToReachFranco,
        totalHtCts: countToReachFranco * filler.packagePriceHtCts,
        reason: `Ajoutez ${countToReachFranco}x pour économiser ${(shippingCostCts / 100).toFixed(2)} € de frais de port.`,
      });
    }

    return fillers;
  }
}
