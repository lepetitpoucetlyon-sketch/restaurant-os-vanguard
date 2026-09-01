/**
 * restaurant.events.ts — Événements de la verticale RESTAURANT.
 *
 * Miroir de `vertical.events.ts` pour les autres secteurs : ce fichier regroupe tout
 * ce qui n'existe QUE parce que le tenant est un restaurant. Les préfixes `pos.`,
 * `bar.` et `kds.` sont verticalisés — une clinique n'a pas de passe, un coworking
 * n'a pas de cave à vin.
 *
 * Fusionne les ex-`pos.events.ts` et `kds.events.ts` (ADR-018, ADR-020).
 * Les événements NEUTRES du service (commandes, tables, encaissement générique)
 * restent dans `ops.events.ts` : ils valent pour les 12 variantes.
 *
 * Pour ajouter un événement restaurant : ici. Pour un événement de service valable
 * quel que soit le métier : `ops.events.ts`.
 */
export interface RESTAURANTEvents {
  // ── Caisse (POS) ────────────────────────────────────────────────────────────
  'pos.order_duplicate_blocked': { v:1; tenantId: string; tableId: string; operatorId: string; windowMs: number; blockedAt: number };

  'pos.tpe_simulation_completed': { v:1; tenantId: string; provider: string; success: boolean; latencyMs: number; errorDetails?: string; simulatedAt: number };

  'pos.split_bill_processed': { v:1; tenantId: string; orderId: string; splitType: 'equipartition' | 'percentage' | 'custom' | 'by_item'; partsCount: number; totalInMicrounits: number; processedAt: number };

  'pos.cash_drawer_reconciled': { v:1; tenantId: string; expectedCashInMicrounits: number; countedCashInMicrounits: number; varianceInMicrounits: number; sessionDateIso: string; reconciledAt: number };

  'pos.meal_voucher_rejected': { v:1; tenantId: string; orderId: string; requestedAmountInMicrounits: number; dailyLimitInMicrounits: number; reason: 'exceeds_daily_limit' | 'ineligible_items_only'; rejectedAt: number };

  'pos.shared_bill_dispatched': { v:1; tenantId: string; orderId: string; channel: 'sms' | 'qr' | 'link'; recipient?: string; dispatchedAt: number };

  'pos.printer_failover': { v:1; tenantId: string; failedPrinterId: string; targetPrinterId: string; station: string; reason: 'paper_out' | 'offline' | 'timeout'; failedAt: number };


  // ── Bar, cave, fermentation ─────────────────────────────────────────────────
  'bar.flash_inventory_completed': { v:1; tenantId: string; bottleCount: number; totalVarianceCl: number; varianceInMicrounits: number; recordedAt: number };


  'bar.corked_bottle_disputed': { v:1; tenantId: string; productId: string; supplierId: string; bottleLot: string; costInMicrounits: number; recordedAt: number };


  'bar.spout_variance_detected': { v:1; tenantId: string; spoutId: string; productId: string; dispensedCl: number; billedCl: number; varianceCl: number; detectedAt: number };


  'bar.fermentation_alert': { v:1; tenantId: string; batchId: string; recipeName: string; brixLevel: number; pressureStatus: 'normal' | 'degas_required' | 'critical_overpressure'; alertedAt: number };

  // ── Cuisine et passe (KDS) ──────────────────────────────────────────────────
  'kds.critical_allergen_interception': {
    v: 1;
    tenantId: string;
    orderId: string;
    itemIds: string[];
    allergens: string[];
    guestName?: string;
    changedAt: number;
    minutesBeforeArrival: number;
  };

  'kds.smart_routing_dispatched': { v:1; tenantId: string; orderId: string; itemId: string; dishName: string; matchedStation: string; confidencePct: number; dispatchedAt: number };

  'kds.station_recovered': { v:1; tenantId: string; stationId: string; missedOrdersReplayedCount: number; recoveredAt: number };

  'kds.pass_pickup_delayed': { v:1; tenantId: string; orderId: string; tableNumber: string; delayedMinutes: number; alertedAt: number };

  'kds.item_delta_modified': { v:1; tenantId: string; orderId: string; itemId: string; addedModifiers: string[]; removedModifiers: string[]; modifiedAt: number };

  'kds.lot_allergen_matrix_updated': { v:1; tenantId: string; supplierLotId: string; ingredientId: string; activeAllergens: string[]; updatedAt: number };

  'kds.micro_sequence_step_triggered': { v:1; tenantId: string; orderId: string; dishName: string; stepNumber: number; actionLabel: string; triggerAt: number };

  'kds.visual_delay_warning': { v:1; tenantId: string; orderId: string; tableNumber: string; elapsedMinutes: number; alertLevel: 'warning_11m' | 'critical_13m'; amuseBoucheTriggered: boolean; alertedAt: number };

  'kds.hot_cold_sync_aligned': { v:1; tenantId: string; orderId: string; coldPrepDelayedSeconds: number; targetServingTs: number; alignedAt: number };

  'kds.degraded_dishwashing_mode_activated': { v:1; tenantId: string; cause: 'dishwasher_failure' | 'dishwasher_staff_absence'; packagingSwitchActive: boolean; activatedAt: number };
}
