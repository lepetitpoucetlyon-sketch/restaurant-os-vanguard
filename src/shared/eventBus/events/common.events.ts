
export interface COMMONEvents {
  "crm.birthday_approaching": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    birthdayAt: string;
    daysUntil: number;
  };

  "eventQuote.draft.saved": {
    v: 1;
    tenantId: string;
    quoteId: string;
    payload?: any;
    timestamp?: number;
  };

  "haccp.nonconformity.saved": {
    v: 1;
    tenantId: string;
    nonconformityId?: string;
    id?: string;
    payload?: any;
    data?: any;
    timestamp?: number;
  };

  "haccp.nonconformity.resolved": {
    v: 1;
    tenantId: string;
    nonconformityId?: string;
    id?: string;
    payload?: any;
    timestamp?: number;
  };

  "haccp.cleaning.completed": {
    tenantId: string;
    taskId?: string;
    id?: string;
    data?: any;
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
  'commerce.campaign.updated': { tenantId: string; id: string; data: any };
  'commerce.campaign.created': { tenantId: string; data: any };
  'commerce.post.updated': { tenantId: string; id: string; data: any };
  'commerce.post.created': { tenantId: string; data: any };
  'commerce.customer.updated': { tenantId: string; id: string; data: any };
  'commerce.customer.created': { tenantId: string; data: any };
  'commerce.reservation.arrived': { tenantId: string; id: string; data: any };
  'marketing.promocode.created': { tenantId: string; id?: string; code?: string; data?: any };
  'marketing.promocode.updated': { tenantId: string; id?: string; code?: string; data?: any };
  'marketing.loyaltycard.issued': { tenantId: string; id?: string; cardId?: string; data?: any; customerId?: string };
  'marketing.loyaltycard.updated': { tenantId: string; id?: string; cardId?: string; data?: any; customerId?: string };
  'crm.customer.created': { tenantId: string; id?: string; data?: any };
  'crm.customer.updated': { tenantId: string; id?: string; data?: any };
  'marketing.booking.toggled': { tenantId: string; id?: string; status?: string; enabled?: boolean };

  // ── HR enrichis ───────────────────────────────────────────────────────────
  'hr.overtime_alert': { tenantId: string; employeeId: string; extraMinutes: number };
  'hr.tip_distributed': { tenantId: string; orderId: string; tipInMicrounits: number; staffIds: string[] };

  // ── Facility ──────────────────────────────────────────────────────────────
  'facility.floor_plan_updated': { tenantId: string; floorId: string; tables: { id: string; capacity: number; x: number; y: number }[] };
  'facility.maintenance_required': { tenantId: string; assetId: string; assetType: string; description: string };

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

  // ── Paramètres Système ───────────────────────────────────────────────────
  'system.settings.updated': { v: 1; tenantId: string; section: string; settings: any; timestamp: number };

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
}
