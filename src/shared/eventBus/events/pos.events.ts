export interface POSEvents {
  'pos.order_duplicate_blocked': { v:1; tenantId: string; tableId: string; operatorId: string; windowMs: number; blockedAt: number };

  'pos.tpe_simulation_completed': { v:1; tenantId: string; provider: string; success: boolean; latencyMs: number; errorDetails?: string; simulatedAt: number };

  'pos.split_bill_processed': { v:1; tenantId: string; orderId: string; splitType: 'equipartition' | 'percentage' | 'custom' | 'by_item'; partsCount: number; totalInMicrounits: number; processedAt: number };

  'pos.cash_drawer_reconciled': { v:1; tenantId: string; expectedCashInMicrounits: number; countedCashInMicrounits: number; varianceInMicrounits: number; sessionDateIso: string; reconciledAt: number };

  'pos.meal_voucher_rejected': { v:1; tenantId: string; orderId: string; requestedAmountInMicrounits: number; dailyLimitInMicrounits: number; reason: 'exceeds_daily_limit' | 'ineligible_items_only'; rejectedAt: number };

  'pos.shared_bill_dispatched': { v:1; tenantId: string; orderId: string; channel: 'sms' | 'qr' | 'link'; recipient?: string; dispatchedAt: number };

  'pos.printer_failover': { v:1; tenantId: string; failedPrinterId: string; targetPrinterId: string; station: string; reason: 'paper_out' | 'offline' | 'timeout'; failedAt: number };

  'bar.flash_inventory_completed': { v:1; tenantId: string; bottleCount: number; totalVarianceCl: number; varianceInMicrounits: number; recordedAt: number };

  'bar.corked_bottle_disputed': { v:1; tenantId: string; productId: string; supplierId: string; bottleLot: string; costInMicrounits: number; recordedAt: number };

  'bar.spout_variance_detected': { v:1; tenantId: string; spoutId: string; productId: string; dispensedCl: number; billedCl: number; varianceCl: number; detectedAt: number };

  'bar.fermentation_alert': { v:1; tenantId: string; batchId: string; recipeName: string; brixLevel: number; pressureStatus: 'normal' | 'degas_required' | 'critical_overpressure'; alertedAt: number };
}
