import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface SupplierCatalogOffer {
  supplierId: string;
  supplierName: string; // 'Metro', 'Transgourmet', 'Sysco', 'Pomona'
  sku: string;
  productName: string;
  unitPriceInMicrounits: number;
  minOrderQuantity: number;
  deliveryLeadTimeDays: number;
}

export interface MercurialeComparisonReport {
  sku: string;
  productName: string;
  bestOffer: SupplierCatalogOffer;
  allOffers: SupplierCatalogOffer[];
  maxPriceSpreadInMicrounits: number;
  potentialSavingsInMicrounits: number;
}

/**
 * MercurialePriceComparisonService — Angle mort H1.
 * Comparateur mercuriale multi-grossistes (Metro, Transgourmet, Sysco, Pomona) :
 * Identifie l'offre la moins chère et calcule les gains financiers potentiels sur le panier d'achat.
 */
export class MercurialePriceComparisonService {
  static compareMercuriales(
    tenantId: string,
    sku: string,
    offers: SupplierCatalogOffer[]
  ): MercurialeComparisonReport {
    if (offers.length === 0) {
      throw new Error(`[MERCURIALE] Aucune offre disponible pour le SKU ${sku}`);
    }

    const sorted = [...offers].sort((a, b) => a.unitPriceInMicrounits - b.unitPriceInMicrounits);
    const bestOffer = sorted[0];
    const highestOffer = sorted[sorted.length - 1];

    const maxPriceSpreadInMicrounits = highestOffer.unitPriceInMicrounits - bestOffer.unitPriceInMicrounits;
    const potentialSavingsInMicrounits = maxPriceSpreadInMicrounits;

    NexusEventBus.emit('stock.mercuriale_price_compared', {
      v: 1,
      tenantId,
      sku,
      lowestSupplierId: bestOffer.supplierId,
      bestPriceInMicrounits: bestOffer.unitPriceInMicrounits,
      potentialSavingsInMicrounits,
      comparedAt: Date.now(),
    });

    return {
      sku,
      productName: bestOffer.productName,
      bestOffer,
      allOffers: sorted,
      maxPriceSpreadInMicrounits,
      potentialSavingsInMicrounits,
    };
  }
}
