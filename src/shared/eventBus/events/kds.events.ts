export interface KDSEvents {
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
