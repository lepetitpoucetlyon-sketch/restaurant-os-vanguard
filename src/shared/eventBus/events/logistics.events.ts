export interface LOGISTICSEvents {
  'waste.logged': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    wasteId: string;
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    reason: string;
  };

  'procurement.mismatch_detected': {
    v: 1;
    tenantId: string;
    purchaseOrderId: string;
    invoiceId: string;
    discrepancies: string[];
  };

  'logistics.supplier_price_deviation': { v:1; tenantId: string; supplierId: string; productId: string; previousPrice: number; newPrice: number; deviationPct: number; detectedAt: number };

  'logistics.secondary_dlc_label_required': { v:1; tenantId: string; productId: string; batchId: string; openedAt: number; secondaryDlcAt: number };

  'logistics.volatile_incompatibility_detected': { v:1; tenantId: string; storageZoneId: string; ethyleneEmitterSku: string; sensitiveSku: string; detectedAt: number };

  'stock.mercuriale_price_compared': { v:1; tenantId: string; sku: string; lowestSupplierId: string; bestPriceInMicrounits: number; potentialSavingsInMicrounits: number; comparedAt: number };

  'stock.rfa_computed': { v:1; tenantId: string; supplierId: string; periodYear: number; totalAnnualSpendInMicrounits: number; rfaDueInMicrounits: number; computedAt: number };

  'stock.supplier_dispute_opened': { v:1; tenantId: string; deliverySlipId: string; supplierId: string; disputedAmountInMicrounits: number; sepaHoldActive: boolean; openedAt: number };

  'stock.dlc_alert_triggered': { v:1; tenantId: string; batchId: string; sku: string; daysRemaining: number; severity: 'j_minus_3' | 'j_minus_1' | 'expired'; alertedAt: number };

  'stock.perpetual_inventory_reconciled': { v:1; tenantId: string; category: string; countedItemsCount: number; totalVarianceInMicrounits: number; reconciledAt: number };

  'stock.variable_weight_recorded': { v:1; tenantId: string; sku: string; lotId: string; grossWeightGrams: number; netWeightGrams: number; yieldPct: number; recordedAt: number };

  'stock.double_pass_ocr_processed': { v:1; tenantId: string; invoiceId: string; confidencePct: number; requiresManualReview: boolean; processedAt: number };

  'stock.sku_substitution_alert': { v:1; tenantId: string; supplierId: string; orderedSku: string; deliveredSku: string; varianceType: 'unauthorized_substitute'; alertedAt: number };

  'stock.commodity_price_surge_detected': { v:1; tenantId: string; ingredientSku: string; previousPriceInMicrounits: number; currentPriceInMicrounits: number; surgePct: number; detectedAt: number };

  'stock.cutoff_alert_triggered': { v:1; tenantId: string; supplierId: string; cutoffTimeIso: string; minutesRemaining: number; draftOrderValueInMicrounits: number; alertedAt: number };

  'stock.free_shipping_optimized': { v:1; tenantId: string; supplierId: string; currentCartInMicrounits: number; francoThresholdInMicrounits: number; suggestedBufferSkus: string[]; optimizedAt: number };

  'stock.inter_station_transfer_recorded': { v:1; tenantId: string; fromStation: string; toStation: string; sku: string; quantity: number; costInMicrounits: number; transferredAt: number };
}
