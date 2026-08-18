import type { MercurialeItem } from '../../mercuriales/MercurialeTypes';
import type { SupplierEntity } from '../../core/domain/supplier.types';
import type { ScannedStockItem } from './ProcurementStockScanner';
import type { RestockItemRecommendation } from '../types';

export class ProcurementOfferMatcher {
  /**
   * Indexe les mercuriales actives par nom d'ingrédient ou ID.
   */
  public static indexMercuriales(
    mercurialeItems: MercurialeItem[]
  ): Map<string, MercurialeItem[]> {
    const mercurialeByIngredient = new Map<string, MercurialeItem[]>();
    for (const m of mercurialeItems) {
      if (!m.isAvailable) continue;
      const key = m.ingredientId || m.name.toLowerCase().trim();
      const list = mercurialeByIngredient.get(key) || [];
      list.push(m);
      mercurialeByIngredient.set(key, list);
    }
    return mercurialeByIngredient;
  }

  /**
   * Trouve la meilleure offre disponible et calcule le conditionnement et les prix.
   */
  public static matchOffer(
    scanned: ScannedStockItem,
    mercurialeIndex: Map<string, MercurialeItem[]>,
    suppliersMap: Map<string, SupplierEntity>,
    fallbackSupplierId?: string
  ): RestockItemRecommendation {
    const { stockItem: item, missingQty, urgency } = scanned;
    const key = item.id || item.name.toLowerCase().trim();
    const offers = mercurialeIndex.get(key) || [];

    let selectedOffer: MercurialeItem | null = null;

    // 1. Chercher le fournisseur préféré configuré
    if (item.supplierId) {
      selectedOffer = offers.find((o) => o.supplierId === item.supplierId) || null;
    }

    // 2. Si non trouvé, prendre la mercuriale la moins chère au prix unitaire de base
    if (!selectedOffer && offers.length > 0) {
      selectedOffer = [...offers].sort((a, b) => a.unitPriceHtCts - b.unitPriceHtCts)[0];
    }

    // 3. Fallback synthétique si aucune mercuriale externe n'est rattachée
    const supplierId = selectedOffer?.supplierId || item.supplierId || fallbackSupplierId || 'supp_default';
    const supplier = suppliersMap.get(supplierId);
    const supplierName = supplier?.name || selectedOffer?.name || 'Fournisseur Général';
    const packagingLabel = selectedOffer?.packagingLabel || `Colis standard 1 ${item.unit}`;
    const conversionFactor = selectedOffer?.conversionFactorToBaseUnit || 1;
    const packagePriceHtCts = selectedOffer?.packagePriceHtCts || Math.round((item.priceInMicrounits ?? 10000000) / 10000);

    // Calcul des colis entiers requis (arrondi supérieur)
    const recommendedPackagesCount = Math.max(1, Math.ceil(missingQty / conversionFactor));
    const totalDeliveredQty = recommendedPackagesCount * conversionFactor;
    const totalHtCts = recommendedPackagesCount * packagePriceHtCts;

    return {
      stockItemId: item.id,
      name: item.name,
      currentQuantity: scanned.currentQty,
      threshold: scanned.threshold,
      criticalThreshold: scanned.criticalThreshold,
      targetQuantity: scanned.targetQuantity,
      unit: item.unit,
      missingQuantity: missingQty,
      urgency,
      selectedSupplierId: supplierId,
      selectedSupplierName: supplierName,
      mercurialeItemId: selectedOffer?.id || `merc_${item.id}`,
      packagingLabel,
      conversionFactor,
      packagePriceHtCts,
      recommendedPackagesCount,
      totalDeliveredQty,
      totalHtCts,
    };
  }
}
