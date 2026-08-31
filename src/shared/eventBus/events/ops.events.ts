import type { CartItem } from '@nexus/contracts';

export interface OPSEvents {
  'order.placed': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tableId: string | null;
    tenantId: string;
    operatorId: string;
    items: CartItem[];
  };

  'order.paid': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tableId: string | null;
    tenantId: string;
    operatorId: string;
    customerId?: string;
    items: CartItem[];
    totalInMicrounits: number;
    paymentMode: string;
    splits?: { amount: number; mode: string }[];
  };

  'order.comp': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tableId?: string | null;
    tenantId: string;
    operatorId: string;
    items: CartItem[];
    totalValueInMicrounits: number;
    reason: string;
  };

  'order.cancelled': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tenantId: string;
    operatorId: string;
    reason?: string;
  };

  'order.split': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tableId: string | null;
    tenantId: string;
    operatorId: string;
    totalInMicrounits: number;
    payments: Array<{ amountInMicrounits: number; guest: number; method: string }>;
  };

  'order.refunded': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tenantId: string;
    operatorId: string;
    amountInMicrounits: number;
    originalPaymentMode: string;
  };

  'stock.low': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    itemName: string;
    currentQuantity: number;
    threshold: number;
  };

  'stock.received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    deliveryId: string;
    purchaseOrderId?: string;
    items: Array<{ itemId: string; quantity: number; unitPrice?: number }>;
  };

  'inventory.stock_adjusted': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    oldQuantity: number;
    newQuantity: number;
    reason: string;
    adjustedBy: string;
  };

  'cash_drawer.opened_unauthorized': {
    v: 1;
    isSimulation?: boolean;
    drawerId: string;
    operatorId: string;
    detectedAt: number;
    tenantId: string;
  };

  'inventory.quarantine_activated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    productIds: string[];
    reason: string;
  };

  'recipe.updated': {
    v: 1;
    tenantId: string;
    recipeId: string;
    productId: string;
  };

  'stock.zero': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    itemName: string;
  };

  'inventory.physical': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    inventoryId: string;
    items: Array<{ itemId: string; theoreticalQty: number; physicalQty: number }>;
    operatorId: string;
  };

  'kds.ticket_received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    stationId?: string;
    items: Array<{ id: string; productId: string; name: string; quantity: number; course: number }>;
  };

  'kds.course_fired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    course: number;
  };

  'kds.item_started': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    itemId: string;
    operatorId?: string;
  };

  'table.cleaned': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
  };

  'kds.item_done': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    itemId: string;
    operatorId?: string;
  };

  'kds.ticket_done': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
  };

  'kds.bumped': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    stationId?: string;
  };

  'kds.rush_alert': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    itemId?: string;
    exceededByMinutes: number;
  };

  'kds.printer_failed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    printerId: string;
    errorReason: string;
  };

  'kds.ticket_delayed': {
    v: 1;
    tenantId: string;
    orderId: string;
    delayInMinutes: number;
  };

  'inventory.waste_logged': {
    v: 1;
    tenantId: string;
    wasteId: string;
    items: Array<{ productId: string; quantity: number }>;
  };

  // ── Déduction stock post-commande ─────────────────────────────────────────
  'inventory.deducted': { tenantId: string; orderId: string; lines: { stockItemId: string; quantity: number }[] };

  // ── Notifications ops ─────────────────────────────────────────────────────
  // ── KDS enrichi ───────────────────────────────────────────────────────────
  'kds.course_passed': { tenantId: string; orderId: string; courseId: string };

  // ── Cadençage KDS (fire next course + rebound) ────────────────────────────
  'kds.fire_next_course': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    course: number;
    stationId?: string;
    firedBy: string;
    firedAt: number;
  };

  'ops.course.fired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    tableId?: string;
    course: 'entree' | 'plat' | 'dessert' | number;
    firedBy: string;
    firedAt: number;
    stationIds?: string[];
  };

  'ops.course.next_requested': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    tableId?: string;
    requestedCourse: 'entree' | 'plat' | 'dessert' | number;
    requestedBy: string;
    requestedAt: number;
  };

  'kds.dish_rebound': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    itemId: string;
    productName: string;
    reason: 'client_refusal' | 'quality' | 'allergen' | 'other';
    operatorId: string;
    reboundAt: number;
  };

  // ── Tables — lock / transfert ─────────────────────────────────────────────
  'table.locked': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    lockedBy: string;
    reason: string;
    lockedAt: number;
  };

  'table.unlocked': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    unlockedBy: string;
    reason?: string;
    unlockedAt: number;
  };

  'table.transferred': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    fromTableId: string;
    toTableId: string;
    orderId: string;
    operatorId: string;
    transferredAt: number;
  };

  'ops.table_closed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    orderId?: string;
    closedBy: string;
    closedAt: number;
  };

  // ── Hardware — imprimante mappée ──────────────────────────────────────────
  'hardware.printer_mapped': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    printerId: string;
    stationId: string;
    name: string;
    printerType: 'receipt' | 'kitchen' | 'bar';
    mappedAt: number;
  };

  // ── POS — login terminal ──────────────────────────────────────────────────
  'pos.terminal_login': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    terminalId: string;
    operatorId: string;
    loggedAt: number;
  };

  // ── Proforma ──────────────────────────────────────────────────────────────
  'order.proforma_printed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    tableId?: string;
    operatorId: string;
    totalInMicrounits: number;
    printedAt: number;
  };

  'table.assigned': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    reservationId?: string;
    partySize: number;
  };

  'table.released': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    orderId?: string;
  };

  'store.rush_mode_toggled': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    isPaused: boolean;
    requestedBy: string;
  };

  'table.cleared': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    orderId?: string;
    sessionEnd?: boolean;
  };

  'store.shift_ended': {
    v: 1;
    tenantId: string;
    shiftId: string;
    endTime: string;
  };

  'service.end': {
    v: 1;
    tenantId: string;
  };

  'commerce.reservation_pacing_saturated': {
    v: 1;
    tenantId: string;
    slot: string;
    partySize: number;
    availableCovers: number;
    suggestedAlternativeSlots: string[];
  };

  'ops.table_split_released': {
    v: 1;
    tenantId: string;
    reservationId: string;
    tableId: string;
    originalPartySize: number;
    actualArrivedPartySize: number;
    freedSeats: number;
    releasedAt: number;
  };

  'commerce.table_lock_acquired': {
    v: 1;
    tenantId: string;
    tableId: string;
    slotIso: string;
    holder: 'google_reserve' | 'widget_web' | 'staff' | 'phone';
    reservationId: string;
    expiresAt: number;
  };

  'commerce.reservation_timezone_normalized': {
    v: 1;
    tenantId: string;
    reservationId: string;
    originalIso: string;
    normalizedIso: string;
    guestTimezone?: string;
    tenantTimezone: string;
  };

  'ops.turnover_delay_predicted': {
    v: 1;
    tenantId: string;
    tableId: string;
    currentReservationId: string;
    nextReservationId: string;
    predictedOverstayMinutes: number;
    nextSlotIso: string;
  };

  'ops.table_transferred': { v:1; tenantId: string; orderId: string; fromTableId: string; toTableId: string; operatorId: string; transferredAt: number };

  'ops.tables_merged': { v:1; tenantId: string; primaryTableId: string; secondaryTableId: string; mergedOrderId: string; operatorId: string; mergedAt: number };

  'ops.commercial_gesture_offered': { v:1; tenantId: string; orderId: string; tableId: string; itemName: string; amountInMicrounits: number; authorizedBy: string; reason: string; offeredAt: number };

  'ops.allergen_order_blocked': { v:1; tenantId: string; orderId: string; guestAllergens: string[]; matchedItems: string[]; blockedAt: number };

  'ops.ingredient_eightysixted': { v:1; tenantId: string; ingredientId: string; ingredientName: string; affectedDishIds: string[]; blockedBy: string; eightysixedAt: number };

  'commerce.reservation_trust_flagged': { v:1; tenantId: string; ipAddress: string; phoneHash: string; cancelCount: number; windowHours: number; flaggedAt: number };

  'ops.code_ambre_triggered': { v:1; tenantId: string; tableId: string; triggeredBy: string; triggeredAt: number };

  'commerce.aot_terrace_quota_exceeded': { v:1; tenantId: string; currentCapacity: number; maxQuota: number; excessSeats: number; detectedAt: number };

  'ops.agec_carafe_attached': { v:1; tenantId: string; orderId: string; couverts: number; quantity: number; attachedAt: number };

  'ops.dine_and_dash_suspected': { v:1; tenantId: string; orderId: string; tableId: string; openSinceMinutes: number; estimatedLossInMicrounits: number; detectedAt: number };

  'production.self_healing_recipe_substituted': { v:1; tenantId: string; dishId: string; missingIngredientId: string; substituteIngredientId: string; portionCostDiffInMicrounits: number; substitutedAt: number };

  'production.meat_resting_completed': { v:1; tenantId: string; orderId: string; cutName: string; targetRestSeconds: number; completedAt: number };

  'ops.rain_plan_switch_executed': { v:1; tenantId: string; activeTerraceTablesCount: number; reassignedToIndoorCount: number; packedTakeawayCount: number; executedAt: number };
}
