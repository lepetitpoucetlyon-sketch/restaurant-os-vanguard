/**
 * AutoProcurementEngine.ts
 * 
 * Moteur souverain d'Auto-Approvisionnement et de Calcul de Réassort Intelligent (SRM Grade X).
 * Invariants :
 * - Calculs stricts en centimes entiers (zéro flottant).
 * - Arrondi mathématique supérieur au conditionnement grossiste (ex: 7kg nécessaires en sac de 5kg -> 2 sacs = 10kg).
 * - Optimisation d'atteinte du Franco de port & suggestions de comblement non-périssable.
 */

import type { StockItem } from '../../domain/schemas/inventory';
import type { MercurialeItem } from '../mercuriales/MercurialeTypes';
import type { SupplierEntity } from '../core/domain/supplier.types';
import type { PurchaseOrderEntity, PurchaseOrderItem } from '../orders/SupplierOrderTypes';
import { ProcurementStockScanner } from './services/ProcurementStockScanner';
import { ProcurementOfferMatcher } from './services/ProcurementOfferMatcher';
import { ProcurementBasketOptimizer } from './services/ProcurementBasketOptimizer';
import type {
  RestockUrgency,
  RestockItemRecommendation,
  SupplierBasketDraft,
  AutoProcurementAnalysisResult,
} from './types';

export type {
  RestockUrgency,
  RestockItemRecommendation,
  SupplierBasketDraft,
  AutoProcurementAnalysisResult,
};

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
    const mercurialeIndex = ProcurementOfferMatcher.indexMercuriales(mercurialeItems);
    const { itemsToRestock: scannedItems, criticalCount, lowStockCount } = ProcurementStockScanner.scan(
      stockItems,
      targetSafetyFactor
    );

    const itemsToRestock: RestockItemRecommendation[] = scannedItems.map((scanned) =>
      ProcurementOfferMatcher.matchOffer(scanned, mercurialeIndex, suppliersMap, suppliers[0]?.id)
    );

    const { supplierBaskets, grandTotalHtCts, estimatedShippingSavingsCts } =
      ProcurementBasketOptimizer.optimizeBaskets(itemsToRestock, suppliersMap, mercurialeItems);

    return {
      totalItemsScanned: stockItems.length,
      criticalItemsCount: criticalCount,
      lowStockItemsCount: lowStockCount,
      supplierBaskets,
      grandTotalHtCts,
      estimatedShippingSavingsCts,
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
