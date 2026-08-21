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
}
