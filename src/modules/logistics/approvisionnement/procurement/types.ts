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

export interface PurchaseOrderItemRef {
  productId: string;
  quantityOrdered?: number;
  unitPriceInCents?: number;
  [key: string]: unknown;
}

export interface PurchaseOrder {
  id: string;
  supplierId?: string;
  items: PurchaseOrderItemRef[];
  totalAmountInCents: number;
  status?: string;
  createdAt?: string | number;
  [key: string]: unknown;
}

export interface DeliveryNoteItemRef {
  productId: string;
  quantityDelivered: number;
  unitPriceInCents?: number;
  [key: string]: unknown;
}

export interface DeliveryNote {
  id: string;
  purchaseOrderId?: string;
  supplierId?: string;
  totalAmountInCents: number;
  status?: string;
  deliveredItems: DeliveryNoteItemRef[];
  receivedAt?: string | number;
  [key: string]: unknown;
}
