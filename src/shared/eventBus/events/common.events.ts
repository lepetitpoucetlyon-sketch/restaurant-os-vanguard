export interface COMMONEvents {
  "crm.birthday_approaching": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    birthdayAt: string;
    daysUntil: number;
  };

  "commerce.promotion_activated": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    promotionId: string;
    discountBps: number;
    productIds: string[];
  };

  "commerce.promotion_expired": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    promotionId: string;
  };

  "commerce.reservation_reconfirmed": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    customerPhone: string;
    date: string;
    time: string;
  };

  "commerce.reservation_cancelled": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    customerPhone: string;
    date: string;
    time: string;
    covers?: number;
  };

  "commerce.reservation_deposit_paid": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    depositId: string;
    amountInMicrounits: number;
    reservationId?: string;
    customerId?: string;
    paidAt: number;
  };

  "commerce.waitlist_ready": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    waitlistEntryId: string;
    guestName: string;
    guestPhone?: string;
    partySize: number;
    estimatedWaitMinutes?: number;
  };

  "ai.query_received": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    query: string;
    contextScope: string;
  };

  "ai.document_uploaded": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    documentId: string;
    fileName: string;
    uploadedBy: string;
  };

  "ai.weekly_report_due": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    periodEnd: string;
  };

  "ai.fleet_brief_requested": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    requestedBy: string;
    fleetScope: string;
  };

  'sovereign.breach': {
    v: 1;
    isSimulation?: boolean;
    targetTenantId: string;
    anchoredTenantId: string;
    path?: string;
    message: string;
  };

  'commerce.yield_updated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    config: Record<string, unknown>;
  };

  'hr.transfer_offer': {
    v: 1;
    isSimulation?: boolean;
    fromTenantId: string;
    toTenantId: string;
    ownerId: string;
    headcount: number;
    bonusInMicrounits: number;
  };

  'reservation.confirmed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    customerName: string;
    covers: number;
    date: string;
    time: string;
  };

  'haccp.check.saved': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    checkId: string;
    operatorId: string;
    timestamp: number;
  };

  'haccp.nonconform': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    checkId: string;
    correctionDeadline: number;
  };

  'hr.training_expired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    employeeId: string;
    trainingType: string;
  };

  'compliance.deadline_approaching': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    type: string;
    daysLeft: number;
  };

  'security.pin_locked': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    terminalId: string;
    lockedUntil: number;
  };

  'haccp.alert': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    sensorId: string;
    readingId: string;
    alertType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
  };

  'payroll.submitted': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    period: string;
    submissionId: string;
    employeeCount: number;
  };

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

  'hr.clock_in': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    timestamp: number;
  };

  'haccp.temperature_logged': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    sensorId: string;
    temperature: number;
    unit: string;
    timestamp: number;
  };

  'staff.clock_in': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    userName: string;
    terminalId: string;
    timestamp: string;
  };

  'staff.clock_out': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    userName: string;
    terminalId: string;
    timestamp: string;
  };

  'notification.created': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    id: string;
    type: 'alert' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    read: boolean;
    timestamp: string;
  };

  'notification.urgent': {
    v: 1;
    tenantId: string;
    message: string;
    metadata?: Record<string, unknown>;
    roles: string[];
    priority?: 'CRITICAL' | 'HIGH';
  };

  'hr.absence_declared': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    absenceType: 'sick' | 'vacation' | 'unjustified';
    startDate: string;
    endDate?: string;
  };

  'hr.preroll_validated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    periodId: string;
    validatedBy: string;
    totalEmployees: number;
  };

  'hr.contract_expiring': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    contractId: string;
    expiryDate: string;
    daysRemaining: number;
  };

  'hr.medical_visit_expired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    expiryDate: string;
    daysOverdue: number;
  };

  'hr.application_received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    applicationId: string;
    role: string;
    applicantName: string;
  };

  'commerce.margin_warning': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    productId: string;
    currentMarginBps: number;
    thresholdBps: number;
    triggerEventId: string;
  };

  'recall.declared': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    recallId: string;
    productIds: string[];
    reason: string;
  };

  'cert.expired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    certId: string;
    certType: string;
    entityName: string;
    expiredAt: string;
  };

  'compliance.calendar': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    eventType: 'audit' | 'renewal' | 'inspection' | 'training';
    title: string;
    dueDate: string;
    daysUntilDue: number;
  };

  'dlc.expired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    batchNumber: string;
    quantity: number;
  };

  'iot.offline': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    sensorId: string;
    lastSeenAt: number;
  };

  'reservation.created': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    guestName: string;
    partySize: number;
    scheduledAt: number;
    hasDeposit: boolean;
  };

  'reservation.updated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    updates: Record<string, unknown>;
  };

  'reservation.cancelled': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    reason: string;
  };

  'reservation.no_show': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    customerId?: string;
    customerName?: string;
    covers?: number;
    date?: string;
    time?: string;
    chargedAmount?: number;
  };

  'reservation.large_group': {
    v: 1;
    tenantId: string;
    reservationId: string;
    covers: number;
    datetime: string;
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

  'hr.shift_started': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    shiftId: string;
    employeeId: string;
    startedAt: number;
    role: string;
  };

  'hr.shift_ended': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    shiftId: string;
    employeeId: string;
    endedAt: number;
  };

  'hr.schedule_published': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    weekStart: number;
    publishedBy: string;
  };

  'hr.payroll_exported': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    periodStart: number;
    periodEnd: number;
    exportedBy: string;
  };

  'crm.customer_created': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    email?: string;
    phone?: string;
    source: string;
  };

  'crm.customer_updated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    updates: Record<string, unknown>;
  };

  'crm.points_earned': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    points: number;
    sourceOrderId: string;
  };

  'crm.reward_redeemed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    rewardId: string;
    pointsCost: number;
  };

  'crm.reward_unlocked': {
    v: 1;
    tenantId: string;
    customerId: string;
    rewardId: string;
    rewardName: string;
  };

  'crm.segment_matched': {
    v: 1;
    tenantId: string;
    customerId: string;
    segmentId: string;
    segmentName: string;
  };

  'marketing.campaign_launched': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    campaignId: string;
    targetSegment: string;
    launchedBy: string;
  };

  'anomaly.detected': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    type: string;
    message: string;
    zScore?: number;
    metadata?: Record<string, unknown>;
  };

  'payment.rejected': {
    v: 1;
    tenantId: string;
    orderId: string;
    reason: string;
    amountInMicrounits: number;
  };

  'store.rush_mode_toggled': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    isPaused: boolean;
    requestedBy: string;
  };

  'overtime.threshold': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    employeeId: string;
    hoursWorked: number;
    hoursLimit: number;
    periodStart: string;
    periodEnd: string;
  };

  'inactive.90d': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    lastVisitDate: string;
    totalSpentInMicrounits: number;
  };

  'review.negative': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reviewId: string;
    customerId: string;
    rating: number;
    platform: string;
    content: string;
  };

  'review.positive': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reviewId: string;
    customerId: string;
    rating: number;
    platform: string;
    content: string;
  };

  'quote.sent': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    quoteId: string;
    customerId: string;
    totalInMicrounits: number;
    sentAt: string;
  };

  'invoice.overdue': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    invoiceId: string;
    customerId: string;
    amountInMicrounits: number;
    dueDaysOverdue: number;
  };

  'report.send.failed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reportId: string;
    recipientEmail: string;
    reportType: string;
    attemptCount: number;
    error: string;
  };

  'llm.timeout': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    requestId: string;
    model: string;
    prompt: string;
    attemptCount: number;
  };

  'oracle.query': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    requestId: string;
    model: string;
    prompt: string;
    isFallback?: boolean;
  };

  'resa.j1': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    customerId: string;
    date: string;
    time: string;
    covers: number;
  };

  'table.cleared': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    orderId?: string;
    sessionEnd?: boolean;
  };

  'biggroup.confirmed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    covers: number;
    date: string;
    customerId?: string;
  };

  'store.shift_ended': {
    v: 1;
    tenantId: string;
    shiftId: string;
    endTime: string;
  };

  'delivery.delivered': {
    v: 1;
    tenantId: string;
    deliveryId: string;
    orderId: string;
    driverId?: string;
  };

  'sensor.temperature_anomaly': {
    v: 1;
    tenantId: string;
    sensorId: string;
    temperature: number;
    durationInMinutes: number;
  };

  'service.end': {
    v: 1;
    tenantId: string;
  };

  'procurement.mismatch_detected': {
    v: 1;
    tenantId: string;
    purchaseOrderId: string;
    invoiceId: string;
    discrepancies: string[];
  };

  // ── CRM / Intelligence ────────────────────────────────────────────────────
  'crm.rfm_trigger': { tenantId: string; customerId: string };
  'intelligence.menu_engineering_requested': { tenantId: string; periodDays: number };
  'analytics.sales_data_ready': { tenantId: string; periodStart: string; periodEnd: string; totalInMicrounits: number; covers: number };
  'analytics.anomaly_detected': { tenantId: string; metric: string; value: number; threshold: number; detectedAt: string };

  // ── HR enrichis ───────────────────────────────────────────────────────────
  'hr.overtime_alert': { tenantId: string; employeeId: string; extraMinutes: number };
  'hr.tip_distributed': { tenantId: string; orderId: string; tipInMicrounits: number; staffIds: string[] };

  // ── Facility ──────────────────────────────────────────────────────────────
  'facility.floor_plan_updated': { tenantId: string; floorId: string; tables: { id: string; capacity: number; x: number; y: number }[] };
  'facility.maintenance_required': { tenantId: string; assetId: string; assetType: string; description: string };
  'facility.equipment_registered': { tenantId: string; equipmentId: string; name: string; category: string; registeredBy: string; registeredAt: string };
  'facility.equipment_breakdown': { tenantId: string; equipmentId: string; equipmentName: string; severity: 'minor' | 'degraded' | 'critical'; errorCode?: string; reason: string; declaredBy: string; declaredAt: string };
  'facility.equipment_repaired': { tenantId: string; equipmentId: string; technicianName: string; costInMicrounits: number; resolvedAt: string; partsReplaced?: string[] };
  'facility.guide_attached': { tenantId: string; equipmentId: string; guideId: string; guideType: string; title: string; addedBy: string };
  'facility.warranty_expiring_soon': { tenantId: string; equipmentId: string; equipmentName: string; warrantyExpiresAt: string; daysRemaining: number };

  // ── Réservation — accueil client (I3: Résa → KDS allergens) ──────────────
  'reservation.matched': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    customerId?: string;
    tableId: string;
    allergens: string[];
    covers: number;
    matchedAt: number;
  };

  // ── HR — vérification pause légale HCR (6h → 30 min) ────────────────────
  'hr.break_checked': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    employeeId: string;
    shiftId: string;
    shiftDurationHours: number;
    breakMinutes: number;
    required: boolean;
    compliant: boolean;
  };

  // ── CRM — allergens signalés sur profil client ────────────────────────────
  'crm.allergen_flagged': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    reservationId: string;
    allergens: string[];
    tableId: string;
    flaggedAt: number;
  };

  // ── HACCP — cycle de refroidissement légal ────────────────────────────────
  'haccp.cooling_cycle_logged': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    batchId: string;
    productId: string;
    productName: string;
    startTempCelsius: number;
    endTempCelsius: number;
    durationMinutes: number;
    operatorId: string;
    compliant: boolean;
    loggedAt: number;
  };

  // ── Intelligence — BCG calculé ────────────────────────────────────────────
  'intelligence.bcg_calculated': {
    tenantId: string;
    stars: string[];
    plowhorses: string[];
    puzzles: string[];
    dogs: string[];
    calculatedAt: string;
  };

  // ── Crypto — intégrité chaîne NF525 rompue ────────────────────────────────
  'crypto.integrity_failed': {
    v: 1;
    tenantId: string;
    journalId: string;
    expectedHash: string;
    actualHash: string;
    detectedAt: number;
  };

  // ── Angles morts M101-M110 (matrice EventBus + DLQ + RBAC + Settings) ─────
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

  'system.sms_delivery_failed': {
    v: 1;
    tenantId: string;
    recipientPhone: string;
    provider: string;
    error: string;
    fallbackUsed: 'email' | 'none';
    failedAt: number;
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

  'system.sms_segment_warning': {
    v: 1;
    tenantId: string;
    recipientPhone: string;
    originalLength: number;
    sanitizedLength: number;
    encoding: 'GSM-7' | 'UCS-2';
    segments: number;
    strippedChars: string[];
  };

  'security.unauthorized_access_attempt': {
    v: 1;
    tenantId: string;
    resource: string;
    ipAddress: string;
    reason: 'invalid_hmac' | 'expired_token' | 'ip_throttled' | 'user_not_found';
    attemptedAt: number;
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

  'finance.giftcard_locked': {
    v: 1;
    tenantId: string;
    giftcardId: string;
    lockedBy: 'pos' | 'web';
    orderId?: string;
    amountInMicrounits: number;
    expiresAt: number;
  };

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

  // ── Angles morts batch 2 (2026-08-21) ─────────────────────────────────────
  'pos.order_duplicate_blocked': { v:1; tenantId: string; tableId: string; operatorId: string; windowMs: number; blockedAt: number };
  'finance.provisional_seal_created': { v:1; tenantId: string; orderId: string; operatorId: string; totalInMicrounits: number; sealedAt: number };
  'finance.provisional_seal_annulled': { v:1; tenantId: string; orderId: string; actorId: string; reason: string; annulledAt: number };
  'finance.addon_ticket_created': { v:1; tenantId: string; parentSealId: string; addonOrderId: string; addonTotalInMicrounits: number; createdAt: number };
  'finance.advance_invoice_issued': { v:1; tenantId: string; invoiceId: string; orderId: string; amountInMicrounits: number; tvaInMicrounits: number; issuedAt: number };
  'finance.cash_variance_recorded': { v:1; tenantId: string; dateIso: string; expectedInMicrounits: number; actualInMicrounits: number; varianceInMicrounits: number; account: '658' | '757'; recordedAt: number };
  'ops.table_transferred': { v:1; tenantId: string; orderId: string; fromTableId: string; toTableId: string; operatorId: string; transferredAt: number };
  'ops.tables_merged': { v:1; tenantId: string; primaryTableId: string; secondaryTableId: string; mergedOrderId: string; operatorId: string; mergedAt: number };
  'ops.commercial_gesture_offered': { v:1; tenantId: string; orderId: string; tableId: string; itemName: string; amountInMicrounits: number; authorizedBy: string; reason: string; offeredAt: number };
  'finance.change_as_tip': { v:1; tenantId: string; orderId: string; changeInMicrounits: number; tipInMicrounits: number; operatorId: string; recordedAt: number };
  'ops.allergen_order_blocked': { v:1; tenantId: string; orderId: string; guestAllergens: string[]; matchedItems: string[]; blockedAt: number };
  'compliance.recall_broadcast': { v:1; tenantId: string; recallId: string; productRef: string; affectedBatchIds: string[]; affectedTenantCount: number; broadcastAt: number };
  'compliance.disinfection_sequence_violation': { v:1; tenantId: string; stationId: string; fromTask: string; toTask: string; requiredProtocol: string; violatedAt: number };
  'compliance.oil_friture_test_required': { v:1; tenantId: string; frituseId: string; lastTestAt?: number; reason: 'first_use' | 'daily_limit'; triggeredAt: number };
  'finance.tpe_reconciliation_blocked': { v:1; tenantId: string; orderId: string; tpeTransactionId: string; tpeStatus: string; blockedAt: number };
  'finance.ticket_z_missing': { v:1; tenantId: string; missingDateIso: string; detectedAt: number };
  'finance.grand_total_sealed': { v:1; tenantId: string; period: 'monthly' | 'annual'; periodLabel: string; totalInMicrounits: number; hash: string; sealedAt: number };
  'ops.ingredient_eightysixted': { v:1; tenantId: string; ingredientId: string; ingredientName: string; affectedDishIds: string[]; blockedBy: string; eightysixedAt: number };
  'analytics.revpash_alert': { v:1; tenantId: string; tableId: string; seats: number; revPash: number; badge: 'green' | 'yellow' | 'red' | 'violet'; periodMinutes: number; alertedAt: number };
  'compliance.bsdd_waste_oil_recorded': { v:1; tenantId: string; entryId: string; volumeLiters: number; collectorSiret?: string; recordedAt: number };
  'security.mass_data_export_alert': { v:1; tenantId: string; actorId: string; exportedCount: number; thresholdCount: number; resourceType: string; alertedAt: number };
  'commerce.reservation_trust_flagged': { v:1; tenantId: string; ipAddress: string; phoneHash: string; cancelCount: number; windowHours: number; flaggedAt: number };
  'finance.tva_livraison_mismatch': { v:1; tenantId: string; orderId: string; consumptionMode: string; providedTaxRate: string; expectedTaxRate: string; detectedAt: number };
  'hr.rest_period_violation': { v:1; tenantId: string; employeeId: string; shiftStartIso: string; previousShiftEndIso: string; gapMinutes: number; requiredMinutes: number; violatedAt: number };
  'hr.work_accident_declared': { v:1; tenantId: string; employeeId: string; accidentId: string; injuryType: string; reportedAt: number; cpamDeadlineAt: number };
  'compliance.co2_alarm_triggered': { v:1; tenantId: string; locationId: string; ppmLevel: number; threshold: number; triggeredAt: number };
  'compliance.fire_safety_test_due': { v:1; tenantId: string; testType: 'baes_monthly' | 'annual_commission'; lastTestAt?: number; dueAt: number };
  'compliance.water_cut_protocol_triggered': { v:1; tenantId: string; detectedAt: number; estimatedRestorationIso?: string; notifiedOperatorId: string };
  'finance.dunning_email_sent': { v:1; tenantId: string; invoiceId: string; step: 'j3' | 'j7' | 'j14'; emailRecipient: string; sentAt: number };
  'finance.tenant_suspended_unpaid': { v:1; tenantId: string; invoiceId: string; overduedays: number; suspendedAt: number };
  'logistics.supplier_price_deviation': { v:1; tenantId: string; supplierId: string; productId: string; previousPrice: number; newPrice: number; deviationPct: number; detectedAt: number };
  'logistics.secondary_dlc_label_required': { v:1; tenantId: string; productId: string; batchId: string; openedAt: number; secondaryDlcAt: number };
  'ops.code_ambre_triggered': { v:1; tenantId: string; tableId: string; triggeredBy: string; triggeredAt: number };
  'commerce.aot_terrace_quota_exceeded': { v:1; tenantId: string; currentCapacity: number; maxQuota: number; excessSeats: number; detectedAt: number };
  'compliance.breathalyzer_test_due': { v:1; tenantId: string; erp: boolean; reason: 'nightly' | 'incident'; dueAt: number };
  // Batch 3 — 2026-08-21
  'ops.agec_carafe_attached': { v:1; tenantId: string; orderId: string; couverts: number; quantity: number; attachedAt: number };
  'finance.complementary_invoice_created': { v:1; tenantId: string; invoiceId: string; originalOrderId: string; customerName: string; deadlineAt: number; createdAt: number };
  'hr.tip_redistribution_processed': { v:1; tenantId: string; poolId: string; periodLabel: string; totalInMicrounits: number; employeeCount: number; processedAt: number };
  'hr.auto_clockout_at_z': { v:1; tenantId: string; closedCount: number; closedEmployeeIds: string[]; zClosureAt: number };
  'ops.dine_and_dash_suspected': { v:1; tenantId: string; orderId: string; tableId: string; openSinceMinutes: number; estimatedLossInMicrounits: number; detectedAt: number };
  'finance.antidated_invoice_blocked': { v:1; tenantId: string; issuedBy: string; invoiceDateIso: string; backdateDays: number; blockedAt: number };
  'security.admin_session_revoked': { v:1; uid: string; reason: string; revokedAt: number };
  'commerce.review_bombing_detected': { v:1; tenantId: string; burstCount: number; avgRating: number; noTextRatio: number; windowHours: number; detectedAt: number };
  'compliance.witness_dish_checklist_created': { v:1; tenantId: string; reservationId: string; couverts: number; dishCount: number; retainUntil: number; createdAt: number };
  'compliance.frying_oil_threshold_exceeded': { v:1; tenantId: string; stationId: string; polarCompoundsPct: number; maxAllowed: number; testedAt: number };
  'compliance.breathalyzer_stock_low': { v:1; tenantId: string; currentStock: number; minStock: number; detectedAt: number };
  'compliance.nf525_cert_expiry_alert': { v:1; tenantId: string; certNumber: string; daysUntilExpiry: number; severity: 'warning' | 'critical' | 'expired'; detectedAt: number };
  'finance.reseller_commission_generated': { v:1; resellerId: string; periodLabel: string; totalCommissionInMicrounits: number; tenantCount: number; generatedAt: number };
  // Batch 4 — 2026-08-21 (POS, Salle, Bar, Hardware)
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
  'facility.device_overheated': { v:1; tenantId: string; deviceId: string; temperatureCelsius: number; targetFailoverTerminalId: string; failoverAt: number };
  // Batch 5 — 2026-08-21 (KDS, Cuisine, Recettes, HACCP)
  'kds.smart_routing_dispatched': { v:1; tenantId: string; orderId: string; itemId: string; dishName: string; matchedStation: string; confidencePct: number; dispatchedAt: number };
  'kds.station_recovered': { v:1; tenantId: string; stationId: string; missedOrdersReplayedCount: number; recoveredAt: number };
  'kds.pass_pickup_delayed': { v:1; tenantId: string; orderId: string; tableNumber: string; delayedMinutes: number; alertedAt: number };
  'compliance.haccp_frequency_violated': { v:1; tenantId: string; taskType: string; equipmentId: string; requiredFrequencyPerDay: number; actualLoggedCount: number; alertedAt: number };
  'compliance.iot_sensor_fault': { v:1; tenantId: string; sensorId: string; equipmentId: string; faultType: 'radio_lost' | 'power_lost' | 'true_temperature_breach'; tempCelsius?: number; detectedAt: number };
  'compliance.tiac_emergency_opened': { v:1; tenantId: string; incidentId: string; suspectedDishes: string[]; affectedCovers: number; reportedAt: number };
  'compliance.food_donation_report_generated': { v:1; tenantId: string; periodLabel: string; totalWeightKg: number; beneficiaryOrg: string; generatedAt: number };
  'kds.item_delta_modified': { v:1; tenantId: string; orderId: string; itemId: string; addedModifiers: string[]; removedModifiers: string[]; modifiedAt: number };
  'kds.lot_allergen_matrix_updated': { v:1; tenantId: string; supplierLotId: string; ingredientId: string; activeAllergens: string[]; updatedAt: number };
  'kds.micro_sequence_step_triggered': { v:1; tenantId: string; orderId: string; dishName: string; stepNumber: number; actionLabel: string; triggerAt: number };
  'kds.visual_delay_warning': { v:1; tenantId: string; orderId: string; tableNumber: string; elapsedMinutes: number; alertLevel: 'warning_11m' | 'critical_13m'; amuseBoucheTriggered: boolean; alertedAt: number };
  'logistics.volatile_incompatibility_detected': { v:1; tenantId: string; storageZoneId: string; ethyleneEmitterSku: string; sensitiveSku: string; detectedAt: number };
  'compliance.crustacean_tank_alert': { v:1; tenantId: string; tankId: string; oxygenLevelMgL: number; tempCelsius: number; salinityPpt: number; isCritical: boolean; detectedAt: number };
  'compliance.grease_trap_alert': { v:1; tenantId: string; trapId: string; saturationPct: number; requiresEmptying: boolean; detectedAt: number };
  'compliance.emergency_exit_verified': { v:1; tenantId: string; exitId: string; photoVerificationUrl: string; verifiedBy: string; verifiedAt: number };
  'compliance.hood_delta_t_critical': { v:1; tenantId: string; hoodId: string; deltaTCelsius: number; gasCutoffTriggered: boolean; detectedAt: number };
  'production.self_healing_recipe_substituted': { v:1; tenantId: string; dishId: string; missingIngredientId: string; substituteIngredientId: string; portionCostDiffInMicrounits: number; substitutedAt: number };
  'production.meat_resting_completed': { v:1; tenantId: string; orderId: string; cutName: string; targetRestSeconds: number; completedAt: number };
  'kds.hot_cold_sync_aligned': { v:1; tenantId: string; orderId: string; coldPrepDelayedSeconds: number; targetServingTs: number; alignedAt: number };
  'compliance.thawing_protocol_violation': { v:1; tenantId: string; batchId: string; methodUsed: string; isHotWaterForbidden: boolean; detectedAt: number };
  'compliance.pest_control_3d_recorded': { v:1; tenantId: string; interventionDateIso: string; providerSiret: string; certNumber: string; recordedAt: number };
  'compliance.cleaning_rinse_validated': { v:1; tenantId: string; zoneId: string; residualPh: number; isRinseComplete: boolean; validatedAt: number };
  'compliance.meat_aging_humidity_alert': { v:1; tenantId: string; chamberId: string; relativeHumidityPct: number; minAllowedPct: number; maxAllowedPct: number; detectedAt: number };
  'compliance.dining_room_co2_warning': { v:1; tenantId: string; roomZone: string; co2Ppm: number; vmcBoostActivated: boolean; alertedAt: number };
  // Batch 6 — 2026-08-21 (RH, Conventions HCR, Stocks, Achats, Livraison)
  'hr.hcr_payroll_computed': { v:1; tenantId: string; employeeId: string; periodLabel: string; basePayInMicrounits: number; overtimeInMicrounits: number; nightBonusInMicrounits: number; totalGrossInMicrounits: number; computedAt: number };
  'hr.shift_planning_conflict_detected': { v:1; tenantId: string; employeeId: string; shiftId: string; conflictType: 'overlap' | 'daily_amplitude_exceeded' | 'daily_rest_insufficient' | 'weekly_rest_insufficient'; detectedAt: number };
  'hr.time_clock_punched': { v:1; tenantId: string; employeeId: string; punchType: 'in' | 'out' | 'break_start' | 'break_end'; timestampUtc: number; isGeofenceValid: boolean; punchedAt: number };
  'hr.leave_request_processed': { v:1; tenantId: string; requestId: string; employeeId: string; leaveType: 'cp' | 'rtt' | 'unpaid' | 'sick'; daysCount: number; isApproved: boolean; processedAt: number };
  'hr.dpae_submitted': { v:1; tenantId: string; employeeId: string; urssafDpaeReference: string; hireDateIso: string; submittedAt: number };
  'stock.mercuriale_price_compared': { v:1; tenantId: string; sku: string; lowestSupplierId: string; bestPriceInMicrounits: number; potentialSavingsInMicrounits: number; comparedAt: number };
  'stock.rfa_computed': { v:1; tenantId: string; supplierId: string; periodYear: number; totalAnnualSpendInMicrounits: number; rfaDueInMicrounits: number; computedAt: number };
  'stock.supplier_dispute_opened': { v:1; tenantId: string; deliverySlipId: string; supplierId: string; disputedAmountInMicrounits: number; sepaHoldActive: boolean; openedAt: number };
  'stock.dlc_alert_triggered': { v:1; tenantId: string; batchId: string; sku: string; daysRemaining: number; severity: 'j_minus_3' | 'j_minus_1' | 'expired'; alertedAt: number };
  'stock.perpetual_inventory_reconciled': { v:1; tenantId: string; category: string; countedItemsCount: number; totalVarianceInMicrounits: number; reconciledAt: number };
  'delivery.order_normalized': { v:1; tenantId: string; platform: 'uber_eats' | 'deliveroo' | 'just_eat'; platformOrderId: string; posOrderId: string; totalInMicrounits: number; normalizedAt: number };
  'delivery.commission_pnl_calculated': { v:1; tenantId: string; platform: string; platformOrderId: string; grossTtcInMicrounits: number; commissionInMicrounits: number; netMerchantInMicrounits: number; calculatedAt: number };
  'delivery.store_paused': { v:1; tenantId: string; platform: string; reason: 'kitchen_rush' | 'understaffed' | 'manual'; autoResumeAt?: number; pausedAt: number };
  'stock.variable_weight_recorded': { v:1; tenantId: string; sku: string; lotId: string; grossWeightGrams: number; netWeightGrams: number; yieldPct: number; recordedAt: number };
  'stock.double_pass_ocr_processed': { v:1; tenantId: string; invoiceId: string; confidencePct: number; requiresManualReview: boolean; processedAt: number };
  'stock.sku_substitution_alert': { v:1; tenantId: string; supplierId: string; orderedSku: string; deliveredSku: string; varianceType: 'unauthorized_substitute'; alertedAt: number };
  'stock.commodity_price_surge_detected': { v:1; tenantId: string; ingredientSku: string; previousPriceInMicrounits: number; currentPriceInMicrounits: number; surgePct: number; detectedAt: number };
  'kds.degraded_dishwashing_mode_activated': { v:1; tenantId: string; cause: 'dishwasher_failure' | 'dishwasher_staff_absence'; packagingSwitchActive: boolean; activatedAt: number };
  'delivery.courier_pacing_triggered': { v:1; tenantId: string; orderId: string; courierDistanceMeters: number; etaMinutes: number; fireKitchenPrep: boolean; triggeredAt: number };
  'delivery.bag_pin_released': { v:1; tenantId: string; orderId: string; courierPin: string; releasedToCourier: boolean; releasedAt: number };
  'delivery.dual_pricing_applied': { v:1; tenantId: string; productId: string; diningRoomPriceInMicrounits: number; deliveryPriceInMicrounits: number; markupPct: number; appliedAt: number };
  'ops.rain_plan_switch_executed': { v:1; tenantId: string; activeTerraceTablesCount: number; reassignedToIndoorCount: number; packedTakeawayCount: number; executedAt: number };
  'delivery.thermal_packaging_costed': { v:1; tenantId: string; orderId: string; packagingCostInMicrounits: number; itemCategoryCount: number; costedAt: number };
  'delivery.in_transit_cancelled': { v:1; tenantId: string; platformOrderId: string; platform: string; foodLostCostInMicrounits: number; refundClaimSubmitted: boolean; cancelledAt: number };
  'delivery.address_scored': { v:1; tenantId: string; destinationAddress: string; reliabilityScore: number; isAccessible: boolean; scoredAt: number };
  'delivery.cold_dispute_proof_sealed': { v:1; tenantId: string; orderId: string; handoverTempCelsius: number; photoEvidenceHash: string; sealedAt: number };
  'stock.cutoff_alert_triggered': { v:1; tenantId: string; supplierId: string; cutoffTimeIso: string; minutesRemaining: number; draftOrderValueInMicrounits: number; alertedAt: number };
  'stock.free_shipping_optimized': { v:1; tenantId: string; supplierId: string; currentCartInMicrounits: number; francoThresholdInMicrounits: number; suggestedBufferSkus: string[]; optimizedAt: number };
  'stock.inter_station_transfer_recorded': { v:1; tenantId: string; fromStation: string; toStation: string; sku: string; quantity: number; costInMicrounits: number; transferredAt: number };
  'hr.weekly_rest_proof_recorded': { v:1; tenantId: string; employeeId: string; weekIso: string; consecutiveRestHours: number; isLegalCompliant: boolean; recordedAt: number };
  // Batch 7 — 2026-08-21 (MCC Flotte, Observabilité, Trésorerie, Sécurité & CRM)
  'fleet.merchant_provisioned': { v:1; tenantId: string; merchantSiret: string; tradeName: string; initialPlan: string; provisionedAt: number };
  'fleet.saas_billing_invoiced': { v:1; tenantId: string; invoiceId: string; periodLabel: string; totalAmountInMicrounits: number; invoiceStatus: 'issued' | 'paid' | 'overdue'; invoicedAt: number };
  'fleet.benchmark_computed': { v:1; tenantId: string; clusterCategory: string; avgTicketInMicrounits: number; foodCostRatioPct: number; percentileRank: number; computedAt: number };
  'fleet.compliance_audit_computed': { v:1; tenantId: string; overallScorePct: number; nf525Passed: boolean; haccpPassed: boolean; hcrPassed: boolean; computedAt: number };
  'fleet.kill_switch_toggled': { v:1; tenantId: string; featureFlag: string; isEnabled: boolean; toggledBy: string; toggledAt: number };
  'fleet.alert_escalated': { v:1; tenantId: string; incidentId: string; severity: 'P1' | 'P2'; destinationService: 'pagerduty' | 'opsgenie'; escalatedAt: number };
  'finance.cash_pool_balanced': { v:1; groupTenantId: string; fromTenantId: string; toTenantId: string; transferAmountInMicrounits: number; balancedAt: number };
  'fleet.sla_breach_detected': { v:1; tenantId: string; endpoint: string; latencyMs: number; allowedLatencyMs: number; breachAt: number };
  'security.cross_tenant_role_delegated': { v:1; masterAdminId: string; targetTenantId: string; assignedRole: string; delegatedAt: number };
  'security.gdpr_anonymized': { v:1; tenantId: string; customerId: string; anonymizedFieldsCount: number; anonymizedAt: number };
  'security.lockdown_enforced': { v:1; tenantId: string; reason: string; revokedTokensCount: number; lockedAt: number };
  'crm.no_show_penalized': { v:1; tenantId: string; reservationId: string; customerId: string; penaltyAmountInMicrounits: number; chargedAt: number };
  'crm.guest_allergen_alerted': { v:1; tenantId: string; customerId: string; orderId: string; conflictingAllergens: string[]; alertedAt: number };
  'crm.review_request_dispatched': { v:1; tenantId: string; orderId: string; customerPhone: string; channel: 'sms' | 'whatsapp'; dispatchedAt: number };
  'crm.cross_loyalty_points_transacted': { v:1; tenantId: string; customerId: string; pointsDelta: number; newBalance: number; transactedAt: number };
  'crm.turnover_optimized': { v:1; tenantId: string; tableNumber: string; predictedDurationMinutes: number; secondSeatingAvailable: boolean; optimizedAt: number };
  'crm.special_event_deposit_secured': { v:1; tenantId: string; contractId: string; depositAmountInMicrounits: number; eventDateIso: string; securedAt: number };
  'finance.smart_tip_distributed': { v:1; tenantId: string; periodLabel: string; totalPoolInMicrounits: number; beneficiaryCount: number; distributedAt: number };
  'crm.private_dining_contract_signed': { v:1; tenantId: string; contractId: string; customerName: string; totalQuoteInMicrounits: number; signedAt: number };
  'commerce.dynamic_surge_applied': { v:1; tenantId: string; surgeMultiplier: number; reason: 'high_demand_match_night' | 'rush_hour'; appliedAt: number };
  'commerce.sommelier_pairing_suggested': { v:1; tenantId: string; orderId: string; dishSku: string; recommendedWineSku: string; suggestedAt: number };
  'crm.vip_preference_applied': { v:1; tenantId: string; customerId: string; preferenceSummary: string; appliedAt: number };
  'crm.lost_found_registered': { v:1; tenantId: string; itemId: string; itemDescription: string; locationFound: string; registeredAt: number };
  'crm.influencer_collab_tracked': { v:1; tenantId: string; influencerHandle: string; promoCode: string; generatedRevenueInMicrounits: number; trackedAt: number };
  'crm.digital_coat_check_issued': { v:1; tenantId: string; tagNumber: string; customerPhone: string; issuedAt: number };
  'crm.valet_parking_ticket_created': { v:1; tenantId: string; ticketId: string; vehiclePlate: string; spotNumber: string; createdAt: number };
}

