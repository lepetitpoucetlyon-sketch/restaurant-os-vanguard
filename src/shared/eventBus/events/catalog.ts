import type { CartItem } from '@/modules/ops/workflow/engine/types';

export interface NexusEvents {

  "integration.reservation_received": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    integrationId: string;
    platform: string;
    rawPayload: Record<string, unknown>;
  };

  "tenant.onboarding_step_completed": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    stepId: string;
  };
  "tenant.subscription_expired": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    expiredAt: string;
  };
  "fleet.device_provisioned": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    deviceId: string;
  };
  "fleet.device_wipe_requested": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    deviceId: string;
  };
  "fleet.weekly_report_due": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
  };
  "finance.bank_connection_expired": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    connectionId: string;
  };

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
    payments: Array<{ amount: number; guest: number; method: string }>;
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
    items: Array<{ itemId: string; quantity: number }>;
  };
  /**
   * 🛡️ Brèche d'isolation souveraine (cross-tenant drift) détectée par SovereignGuard.
   * Émis par la barrière fiscale ; consommé par SovereignBreachHandler qui déclenche
   * le kill-switch global via MasterBridge. Découple SovereignGuard de MasterBridge
   * (cassure du cycle SovereignGuard → MasterBridge → TimeSync → NexusAdapter → SovereignGuard).
   */
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
  'finance.cash_counted': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    drawerId: string;
    expectedAmountInMicrounits: number;
    actualAmountInMicrounits: number;
    countedBy: string;
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
  'haccp.temperature_logged': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    sensorId: string;
    temperature: number;
    unit: string;
    timestamp: number;
  };
  'fleet.vehicle_assigned': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    vehicleId: string;
    driverId: string;
    assignedAt: number;
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
  /**
   * Émis par une route API serveur (pas par le client) : première émission
   * SSR du bus. Le handler doit donc être enregistré à portée module dans
   * la route elle-même, pas via registerHandlers.ts (100% client).
   */
  'support.ticket_submitted': {
    v: 1;
    isSimulation?: boolean;
    ticketId: string;
    tenantId: string;
    description: string;
    screenshotUrl?: string;
    submittedBy: string;
  };
  'support.ticket_escalated': {
    v: 1;
    isSimulation?: boolean;
    ticketId: string;
    tenantId: string;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
    draftTitle: string;
  };
  'cash_drawer.opened_unauthorized': {
    v: 1;
    isSimulation?: boolean;
    drawerId: string;
    operatorId: string;
    detectedAt: number;
    tenantId: string;
  };
  'supplier.invoice_processed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    supplierId: string;
    invoiceId: string;
    lines: Array<{ stockItemId: string; unitCostInMicrounits: number }>;
    processedAt: number;
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
  'commerce.margin_warning': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    productId: string;
    currentMarginBps: number;
    thresholdBps: number;
    triggerEventId: string;
  };
  'stock.zero': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    itemName: string;
  };
  'stock.transfer': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    fromLocationId: string;
    toLocationId: string;
    itemId: string;
    quantity: number;
    operatorId: string;
  };
  'inventory.physical': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    inventoryId: string;
    items: Array<{ itemId: string; theoreticalQty: number; physicalQty: number }>;
    operatorId: string;
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
  'finance.invoice_approved': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    invoiceId: string;
    supplierId: string;
    amountInMicrounits: number;
    approvedBy: string;
  };
  'finance.payment_dispatched': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    paymentBatchId: string;
    totalAmountInMicrounits: number;
    dispatchedBy: string;
  };
  'finance.period_locked': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    periodId: string;
    lockedBy: string;
    lockedAt: string;
  };
  'finance.payment_failed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    invoiceId: string;
    customerId: string;
    amountInMicrounits: number;
    reason: string;
  };
  'finance.bank_transaction_synced': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    transactionId: string;
    bankAccountId: string;
    amountInMicrounits: number;
    syncedAt: number;
  };
  'finance.reconciliation_completed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reconciliationId: string;
    bankTransactionId: string;
    matchedEntityId: string;
    matchedEntityType: 'invoice' | 'ticket_z' | 'other';
    reconciledBy: string;
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
  'integration.delivery_order_received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    integrationId: string;
    platform: 'ubereats' | 'deliveroo' | 'other';
    rawPayload: Record<string, unknown>;
  };
  'integration.menu_sync_requested': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    integrationId: string;
    requestedBy: string;
  };
  'integration.catalog_mapping_updated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    internalProductId: string;
    externalId: string;
    platform: string;
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
  'finance.ticket_z_closed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    date: string;
    totalInMicrounits: number;
    ordersCount: number;
  };
  'system.audit_log': {
    v: 1;
    tenantId: string;
    action: string;
    userId: string;
    details: Record<string, unknown>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  'system.reference_promoted': {
    variant: string;
    timestamp: string;
    collections: string[];
    promotedBy: string;
  };
  'finance.daily_audit': {
    v: 1;
    tenantId: string;
    date: string;
  };
  'finance.month_closed': {
    v: 1;
    tenantId: string;
    month: string; // YYYY-MM
  };
  'payment.rejected': {
    v: 1;
    tenantId: string;
    orderId: string;
    reason: string;
    amountInMicrounits: number;
  };
  'finance.tax_mismatch': {
    v: 1;
    tenantId: string;
    orderId?: string;
    expectedTax: number;
    actualTax: number;
    date: string;
  };
  'store.rush_mode_toggled': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    isPaused: boolean;
    requestedBy: string;
  };

  // P04-D — Heures supplémentaires
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

  // P06-E — Client inactif 90 jours
  'inactive.90d': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    lastVisitDate: string;
    totalSpentInMicrounits: number;
  };

  // P06-F — Avis négatif
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

  // P07-H — Devis envoyé
  'quote.sent': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    quoteId: string;
    customerId: string;
    totalInMicrounits: number;
    sentAt: string;
  };

  // P07-I — Facture en retard
  'invoice.overdue': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    invoiceId: string;
    customerId: string;
    amountInMicrounits: number;
    dueDaysOverdue: number;
  };

  // P08-E — Échec envoi rapport (retry exponentiel)
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

  // P08-J — Timeout LLM (fallback model chain)
  'llm.timeout': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    requestId: string;
    model: string;
    prompt: string;
    attemptCount: number;
  };

  // Oracle query (IA — requête vers un modèle LLM)
  'oracle.query': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    requestId: string;
    model: string;
    prompt: string;
    isFallback?: boolean;
  };

  // P05-B/C — Rappel J-1 réservation (émis par job planifié la veille)
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

  // P05-I — Table vidée, fin de service (sessionEnd=true = groupe parti)
  'table.cleared': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    orderId?: string;
    sessionEnd?: boolean;
  };

  // P05-K — Grand groupe confirmé (covers ≥ bigGroupThreshold)
  'biggroup.confirmed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    covers: number;
    date: string;
    customerId?: string;
  };

  'kds.ticket_delayed': {
    v: 1;
    tenantId: string;
    orderId: string;
    delayInMinutes: number;
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
  'supplier.delivery_received': {
    v: 1;
    tenantId: string;
    supplierId: string;
    orderId: string;
  };
  'inventory.waste_logged': {
    v: 1;
    tenantId: string;
    wasteId: string;
    items: Array<{ productId: string; quantity: number }>;
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

  // ─── Vertical: Restaurant ──────────────────────────────────────────────────
  'finance.order_sealed': { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string };
  'finance.z_report_requested': { tenantId: string; operatorId: string; requestedAt: string };
  'finance.refund_issued': { tenantId: string; referenceId: string; amountInMicrounits: number; reason: string };
  'intelligence.menu_engineering_requested': { tenantId: string; periodDays: number };
  'facility.floor_plan_updated': { tenantId: string; floorId: string; tables: { id: string; capacity: number; x: number; y: number }[] };
  'facility.maintenance_required': { tenantId: string; assetId: string; assetType: string; description: string };
  'mcc.health_ping': { tenantId: string; status: 'healthy' | 'degraded'; [key: string]: unknown };
  'mcc.fiscal_audit_required': { tenantId: string; reason: string; urgency: 'low' | 'high' | 'critical' };
  'tenant.ready': { tenantId: string };
  // Ops
  'ops.order_notification': { tenantId: string; orderId: string; tableId?: string; totalInMicrounits: number };
  'kds.course_passed': { tenantId: string; orderId: string; courseId: string };
  // Commerce
  'crm.rfm_trigger': { tenantId: string; customerId: string };
  // Human
  'hr.overtime_alert': { tenantId: string; employeeId: string; extraMinutes: number };
  'hr.tip_distributed': { tenantId: string; orderId: string; tipInMicrounits: number; staffIds: string[] };
  // Intelligence
  'analytics.sales_data_ready': { tenantId: string; periodStart: string; periodEnd: string; totalInMicrounits: number; covers: number };
  'analytics.anomaly_detected': { tenantId: string; metric: string; value: number; threshold: number; detectedAt: string };
  // Logistics
  'inventory.deducted': { tenantId: string; orderId: string; lines: { stockItemId: string; quantity: number }[] };

  // ─── Vertical: Hotel ──────────────────────────────────────────────────────
  'hotel.guest_checked_in': { tenantId: string; reservationId: string; guestId: string; roomId: string; checkedInAt: string };
  'hotel.guest_checked_out': { tenantId: string; reservationId: string; guestId: string; roomId: string; totalInMicrounits: number };
  'hotel.room_status_changed': { tenantId: string; roomId: string; status: 'CLEAN' | 'DIRTY' | 'MAINTENANCE' };
  'hotel.housekeeping_task_created': { tenantId: string; taskId: string; roomId: string; assignedTo?: string };
  'hotel.folio_charged': { tenantId: string; guestId: string; reservationId: string; amountInMicrounits: number; description: string };
  'hotel.city_ledger_entry': { tenantId: string; companyId: string; amountInMicrounits: number; reference: string };
  'hotel.room_booked': { tenantId: string; reservationId: string; guestId: string; roomType: string; channel: string; arrivalDate: string; departureDate: string; rateInMicrounits: number };
  'hotel.yield_rate_updated': { tenantId: string; roomType: string; date: string; newRateInMicrounits: number };
  'hotel.fire_safety_check': { tenantId: string; checkId: string; result: 'ok' | 'nok'; floor: number };
  'hotel.housekeeper_assigned': { tenantId: string; employeeId: string; taskId: string; roomId: string };
  'hotel.amenity_consumed': { tenantId: string; roomId: string; itemId: string; quantity: number };
  'hotel.occupancy_snapshot': { tenantId: string; date: string; occupancyRate: number; revpar: number };
  'hotel.room_maintenance_required': { tenantId: string; roomId: string; issue: string; priority: 'low' | 'medium' | 'high' };

  // ─── Vertical: Health ─────────────────────────────────────────────────────
  'health.patient_admitted': { tenantId: string; patientId: string; wardId: string; admittedAt: string; pathology?: string };
  'health.patient_discharged': { tenantId: string; patientId: string; wardId: string; dischargedAt: string };
  'health.bed_status_changed': { tenantId: string; bedId: string; wardId: string; status: 'available' | 'occupied' | 'cleaning' | 'maintenance' };
  'health.insurance_claim_submitted': { tenantId: string; patientId: string; claimId: string; amountInMicrounits: number; insurerId: string };
  'health.act_billed': { tenantId: string; patientId: string; actCode: string; amountInMicrounits: number; practitionerId: string };
  'health.hds_audit_log': { tenantId: string; patientId: string; action: string; performedBy: string; timestamp: string };
  'health.consent_recorded': { tenantId: string; patientId: string; consentType: string; grantedAt: string };
  'health.appointment_booked': { tenantId: string; appointmentId: string; patientId: string; practitionerId: string; slot: string };
  'health.appointment_cancelled': { tenantId: string; appointmentId: string; reason: string };
  'health.practitioner_on_call': { tenantId: string; practitionerId: string; specialty: string; onCallFrom: string; onCallUntil: string };
  'health.medication_dispensed': { tenantId: string; patientId: string; medicationId: string; quantity: number; dispensedBy: string };
  'health.supply_reorder_needed': { tenantId: string; supplyId: string; currentStock: number; reorderThreshold: number };
  'health.patient_flow_snapshot': { tenantId: string; date: string; admissions: number; discharges: number; occupancyRate: number };
  'health.equipment_maintenance_required': { tenantId: string; equipmentId: string; type: string; dueDate: string; critical: boolean };

  // ─── Connecteurs ──────────────────────────────────────────────────────────
  'connectors.auto_activated': { tenantId: string; variant: string; connectors: { id: string; status: 'active' | 'pending_config' }[] };
  'connectors.activated': { tenantId: string; connectorId: string; activatedBy: string };
  'connectors.deactivated': { tenantId: string; connectorId: string; deactivatedBy: string };
  'connectors.config_saved': { tenantId: string; connectorId: string; savedBy: string };
  'connectors.sync_completed': { tenantId: string; connectorId: string; itemsSynced: number };
  'connectors.sync_failed': { tenantId: string; connectorId: string; error: string };

  // ─── Vertical: Auto ───────────────────────────────────────────────────────
  'auto.vehicle_checked_in': { tenantId: string; vehicleId: string; vin: string; customerId: string; mileage: number; checkedInAt: string };
  'auto.diagnostic_completed': { tenantId: string; vehicleId: string; workOrderId: string; faults: { code: string; severity: 'low' | 'medium' | 'critical' }[] };
  'auto.repair_started': { tenantId: string; workOrderId: string; technicianId: string; startedAt: string };
  'auto.vehicle_released': { tenantId: string; vehicleId: string; workOrderId: string; customerId: string; releasedAt: string };
  'auto.invoice_issued': { tenantId: string; workOrderId: string; customerId: string; totalInMicrounits: number; laborInMicrounits: number; partsInMicrounits: number };
  'auto.warranty_claim_submitted': { tenantId: string; vehicleId: string; claimId: string; amountInMicrounits: number; manufacturerId: string };
  'auto.part_consumed': { tenantId: string; partId: string; workOrderId: string; quantity: number };
  'auto.part_reorder_needed': { tenantId: string; partId: string; partNumber: string; currentStock: number; reorderQty: number };
  'auto.certification_expiry': { tenantId: string; vehicleId: string; certType: 'ct' | 'pollution'; expiresAt: string };
  'auto.appointment_booked': { tenantId: string; appointmentId: string; customerId: string; vehicleId: string; serviceType: string; slot: string };
  'auto.customer_satisfaction_logged': { tenantId: string; workOrderId: string; customerId: string; score: number; comment?: string };
  'auto.technician_assigned': { tenantId: string; technicianId: string; workOrderId: string; estimatedHours: number };
  'auto.workshop_metrics_snapshot': { tenantId: string; date: string; workOrdersCompleted: number; avgRepairTimeMinutes: number; revenueInMicrounits: number };
  'auto.lift_maintenance_required': { tenantId: string; liftId: string; issue: string; dueDate: string };

  // ─── Vertical: Bakery ─────────────────────────────────────────────────────
  'bakery.batch_started': { tenantId: string; batchId: string; recipe: string; quantity: number; ovenId: string; startedAt: string };
  'bakery.batch_completed': { tenantId: string; batchId: string; recipe: string; yield: number; completedAt: string };
  'bakery.oven_temp_alert': { tenantId: string; ovenId: string; currentTemp: number; targetTemp: number; severity: 'warning' | 'critical' };
  'bakery.preorder_received': { tenantId: string; preorderId: string; customerId: string; items: { productId: string; quantity: number }[]; pickupDate: string };
  'bakery.display_stock_low': { tenantId: string; productId: string; currentStock: number; threshold: number };
  'bakery.allergen_declared': { tenantId: string; productId: string; allergens: string[]; updatedAt: string };
  'bakery.ingredient_consumed': { tenantId: string; batchId: string; lines: { ingredientId: string; quantity: number }[] };
  'bakery.waste_logged': { tenantId: string; batchId: string; productId: string; quantity: number; reason: string };
  'bakery.metrics_snapshot': { tenantId: string; date: string; batchesProduced: number; wastePercent: number; revenueInMicrounits: number };

  // ─── Vertical: Salon ──────────────────────────────────────────────────────
  'salon.appointment_booked': { tenantId: string; appointmentId: string; customerId: string; stylistId: string; service: string; slot: string };
  'salon.appointment_completed': { tenantId: string; appointmentId: string; customerId: string; stylistId: string; durationMinutes: number; totalInMicrounits: number };
  'salon.appointment_cancelled': { tenantId: string; appointmentId: string; reason: string; customerId: string };
  'salon.no_show': { tenantId: string; appointmentId: string; customerId: string; stylistId: string };
  'salon.stylist_assigned': { tenantId: string; stylistId: string; appointmentId: string };
  'salon.product_consumed': { tenantId: string; productId: string; quantity: number; appointmentId: string };
  'salon.loyalty_earned': { tenantId: string; customerId: string; points: number; sourceAppointmentId: string };
  'salon.chair_metrics_snapshot': { tenantId: string; date: string; totalAppointments: number; utilization: number; revenueInMicrounits: number };

  // ─── Vertical: Retail ─────────────────────────────────────────────────────
  'retail.sale_completed': { tenantId: string; saleId: string; customerId?: string; lines: { productId: string; quantity: number; unitPriceInMicrounits: number }[]; totalInMicrounits: number; paymentMethod: string };
  'retail.return_processed': { tenantId: string; returnId: string; originalSaleId: string; lines: { productId: string; quantity: number }[]; refundInMicrounits: number };
  'retail.stock_alert': { tenantId: string; productId: string; sku: string; currentStock: number; threshold: number };
  'retail.promotion_activated': { tenantId: string; promotionId: string; discountPercent: number; productIds: string[]; validUntil: string };
  'retail.pos_session_opened': { tenantId: string; sessionId: string; operatorId: string; openedAt: string; openingFloat: number };
  'retail.pos_session_closed': { tenantId: string; sessionId: string; operatorId: string; closedAt: string; totalInMicrounits: number };
  'retail.loyalty_earned': { tenantId: string; customerId: string; points: number; sourceSaleId: string };
  'retail.metrics_snapshot': { tenantId: string; date: string; transactions: number; revenueInMicrounits: number; avgBasketInMicrounits: number };
}
