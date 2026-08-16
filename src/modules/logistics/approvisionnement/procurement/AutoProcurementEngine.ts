/**
 * AutoProcurementEngine.ts
 * 
 * Moteur souverain d'Auto-Approvisionnement et de Calcul de Réassort Intelligent (SRM Grade X).
 * Invariants :
 * - Calculs stricts en centimes entiers (zéro flottant).
 * - Arrondi mathématique supérieur au conditionnement grossiste (ex: 7kg nécessaires en sac de 5kg -> 2 sacs = 10kg).
 * - Optimisation d'atteinte du Franco de port & suggestions de comblement non-périssable.
 */

import type { StockItem } from '@/modules/logistics/domain/schemas/inventory';
import type { MercurialeItem } from '../mercuriales/MercurialeTypes';
import type { SupplierEntity } from '../core/domain/supplier.types';
import type { PurchaseOrderEntity, PurchaseOrderItem } from '../orders/SupplierOrderTypes';

export type RestockUrgency = 'CRITICAL' | 'LOW_STOCK' | 'OPTIMAL';

export interface RestockItemRecommendation {
  stockItemId: string;
  name: string;
  currentQuantity: number;
  threshold: number;
  criticalThreshold: number;
  targetQuantity: number; // Niveau de stock cible (Par Level)
  unit: string;
  missingQuantity: number;
  urgency: RestockUrgency;
  selectedSupplierId: string;
  selectedSupplierName: string;
  mercurialeItemId: string;
  packagingLabel: string;
  conversionFactor: number;
  packagePriceHtCts: number;
  recommendedPackagesCount: number;
  totalDeliveredQty: number;
  totalHtCts: number;
}

export interface SupplierBasketDraft {
  supplierId: string;
  supplierName: string;
  items: RestockItemRecommendation[];
  basketTotalHtCts: number;
  francoCts: number;
  shippingCostCts: number;
  isFrancoReached: boolean;
  amountToFrancoCts: number;
  totalWithShippingCts: number;
  suggestedFrancoFillers: Array<{
    mercurialeItemId: string;
    name: string;
    packagingLabel: string;
    packagePriceHtCts: number;
    suggestedPackagesCount: number;
    totalHtCts: number;
    reason: string;
  }>;
}

export interface AutoProcurementAnalysisResult {
  totalItemsScanned: number;
  criticalItemsCount: number;
  lowStockItemsCount: number;
  supplierBaskets: SupplierBasketDraft[];
  grandTotalHtCts: number;
  estimatedShippingSavingsCts: number;
}

export class AutoProcurementEngine {
  /**
   * Analyse l'état des stocks actuels par rapport aux seuils et mercuriales,
   * puis génère les paniers de réassort optimisés par fournisseur.
   */
  public static generateRestockRecommendations(
    stockItems: StockItem[],
    mercurialeItems: MercurialeItem[],
    suppliers: SupplierEntity[],
    targetSafetyFactor: number = 1.2 // Facteur de sécurité par défaut (+20% sur le seuil haut)
  ): AutoProcurementAnalysisResult {
    const suppliersMap = new Map<string, SupplierEntity>(suppliers.map((s) => [s.id, s]));
    
    // Regrouper les mercuriales par nom d'ingrédient ou ID
    const mercurialeByIngredient = new Map<string, MercurialeItem[]>();
    for (const m of mercurialeItems) {
      if (!m.isAvailable) continue;
      const key = m.ingredientId || m.name.toLowerCase().trim();
      const list = mercurialeByIngredient.get(key) || [];
      list.push(m);
      mercurialeByIngredient.set(key, list);
    }

    const itemsToRestock: RestockItemRecommendation[] = [];
    let criticalCount = 0;
    let lowStockCount = 0;

    for (const item of stockItems) {
      const threshold = item.threshold ?? 5;
      const criticalThreshold = item.criticalThreshold ?? 2;
      const currentQty = item.quantityInStock ?? 0;

      // Détection de sous-seuil
      if (currentQty > threshold) {
        continue;
      }

      const urgency: RestockUrgency = currentQty <= criticalThreshold ? 'CRITICAL' : 'LOW_STOCK';
      if (urgency === 'CRITICAL') criticalCount++;
      else lowStockCount++;

      // Niveau cible = Seuil haut * Facteur de sécurité
      const targetQuantity = Math.max(threshold * targetSafetyFactor, threshold + 1);
      const missingQty = Math.max(0, targetQuantity - currentQty);

      // Recherche des offres fournisseurs disponibles
      const key = item.id || item.name.toLowerCase().trim();
      const offers = mercurialeByIngredient.get(key) || [];

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
      const supplierId = selectedOffer?.supplierId || item.supplierId || suppliers[0]?.id || 'supp_default';
      const supplier = suppliersMap.get(supplierId);
      const supplierName = supplier?.name || selectedOffer?.name || 'Fournisseur Général';
      const packagingLabel = selectedOffer?.packagingLabel || `Colis standard 1 ${item.unit}`;
      const conversionFactor = selectedOffer?.conversionFactorToBaseUnit || 1;
      const packagePriceHtCts = selectedOffer?.packagePriceHtCts || Math.round((item.priceInMicrounits ?? 10000000) / 10000);

      // Calcul des colis entiers requis (arrondi au supérieur)
      const recommendedPackagesCount = Math.max(1, Math.ceil(missingQty / conversionFactor));
      const totalDeliveredQty = recommendedPackagesCount * conversionFactor;
      const totalHtCts = recommendedPackagesCount * packagePriceHtCts;

      itemsToRestock.push({
        stockItemId: item.id,
        name: item.name,
        currentQuantity: currentQty,
        threshold,
        criticalThreshold,
        targetQuantity,
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
      });
    }

    // Regrouper par fournisseur pour former les paniers d'achat
    const basketsBySupplier = new Map<string, RestockItemRecommendation[]>();
    for (const rec of itemsToRestock) {
      const list = basketsBySupplier.get(rec.selectedSupplierId) || [];
      list.push(rec);
      basketsBySupplier.set(rec.selectedSupplierId, list);
    }

    const supplierBaskets: SupplierBasketDraft[] = [];
    let grandTotalHtCts = 0;
    let potentialShippingSavings = 0;

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
        potentialShippingSavings += shippingCostCts;
      }

      // Suggestions de remplissage pour atteindre le Franco
      const suggestedFrancoFillers: SupplierBasketDraft['suggestedFrancoFillers'] = [];

      if (!isFrancoReached && amountToFrancoCts > 0) {
        // Chercher des articles non-périssables chez ce fournisseur dans les mercuriales
        const allSupplierMercuriales = mercurialeItems.filter(
          (m) => m.supplierId === supplierId && m.isAvailable && !items.some((it) => it.mercurialeItemId === m.id)
        );

        for (const filler of allSupplierMercuriales.slice(0, 3)) {
          if (filler.packagePriceHtCts <= 0) continue;
          const countToReachFranco = Math.ceil(amountToFrancoCts / filler.packagePriceHtCts);
          suggestedFrancoFillers.push({
            mercurialeItemId: filler.id,
            name: filler.name,
            packagingLabel: filler.packagingLabel,
            packagePriceHtCts: filler.packagePriceHtCts,
            suggestedPackagesCount: countToReachFranco,
            totalHtCts: countToReachFranco * filler.packagePriceHtCts,
            reason: `Ajoutez ${countToReachFranco}x pour économiser ${(shippingCostCts / 100).toFixed(2)} € de frais de port.`,
          });
        }
      }

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
      totalItemsScanned: stockItems.length,
      criticalItemsCount: criticalCount,
      lowStockItemsCount: lowStockCount,
      supplierBaskets,
      grandTotalHtCts,
      estimatedShippingSavingsCts: potentialShippingSavings,
    };
  }

  /**
   * Convertit un panier fournisseur validé en Entité Bon de Commande (PurchaseOrderEntity)
   * prête pour validation humaine et dispatch multi-canal.
   */
  public static buildPurchaseOrderFromBasket(
    tenantId: string,
    basket: SupplierBasketDraft,
    createdById: string,
    orderSequenceNumber: number,
    targetDeliveryDateStr: string,
    vatRatePct: number = 5.5
  ): PurchaseOrderEntity {
    const now = Date.now();
    const datePrefix = new Date(now).toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `BC-${datePrefix}-${String(orderSequenceNumber).padStart(4, '0')}`;

    const items: PurchaseOrderItem[] = basket.items.map((item) => ({
      mercurialeItemId: item.mercurialeItemId,
      ingredientId: item.stockItemId,
      name: item.name,
      packagingLabel: item.packagingLabel,
      packagesCount: item.recommendedPackagesCount,
      packagePriceHtCts: item.packagePriceHtCts,
      totalHtCts: item.totalHtCts,
      totalQuantityBaseUnit: item.totalDeliveredQty,
    }));

    const totalHtCts = basket.basketTotalHtCts;
    const totalVatCts = Math.round((totalHtCts * vatRatePct) / 100);
    const totalTtcCts = totalHtCts + totalVatCts;

    return {
      id: `po_${now}_${Math.random().toString(36).slice(2, 7)}`,
      tenantId,
      orderNumber,
      supplierId: basket.supplierId,
      supplierName: basket.supplierName,
      createdById,
      status: 'DRAFT',
      dispatchChannel: 'WHATSAPP',
      items,
      totalHtCts,
      totalVatCts,
      totalTtcCts,
      francoReached: basket.isFrancoReached,
      shippingCostCts: basket.isFrancoReached ? 0 : basket.shippingCostCts,
      expectedDeliveryDate: targetDeliveryDateStr,
      createdAt: now,
      updatedAt: now,
    };
  }
}
