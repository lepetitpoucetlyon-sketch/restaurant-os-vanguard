/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { logger } from '@/lib/logger';
import type { CartItem } from '@/modules/ops/workflow/engine/types';
import { db } from '@/lib/offline/offline-store';

// ── Catalogue d'événements métier ─────────────────────────────────────────────

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
}

export type NexusEventName = keyof NexusEvents;
export type NexusEventPayload<E extends NexusEventName> = NexusEvents[E];

type Handler<E extends NexusEventName> = (
  payload: NexusEventPayload<E>
) => Promise<void> | void;

interface RegisteredHandler<E extends NexusEventName> {
  id: string;
  event: E;
  handler: Handler<E>;
  priority: 'CRITICAL' | 'HIGH' | 'BACKGROUND';
}

// ── Bus ───────────────────────────────────────────────────────────────────────

class NexusEventBusClass {
  private handlers = new Map<NexusEventName, RegisteredHandler<NexusEventName>[]>();

  /**
   * Souscrit à un événement.
   * priority CRITICAL  → s'exécute en premier, bloquant si nécessaire
   * priority HIGH      → parallèle avec les autres HIGH
   * priority BACKGROUND → lancé après les CRITICAL/HIGH, non-bloquant
   */
  on<E extends NexusEventName>(
    event: E,
    handler: Handler<E>,
    options: { id: string; priority?: RegisteredHandler<E>['priority'] } = { id: crypto.randomUUID() }
  ): () => void {
    const registered: RegisteredHandler<E> = {
      id: options.id,
      event,
      handler,
      priority: options.priority ?? 'HIGH',
    };

    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, registered]);

    return () => this.off(event, options.id);
  }

  off(event: NexusEventName, id: string): void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, existing.filter(h => h.id !== id));
  }

  /**
   * Émet un événement métier de manière durable via l'EventOutbox.
   * Protège contre les crashs entre le persist state (Nexus) et l'exécution des handlers.
   */
  async emitDurable<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>
  ): Promise<void> {
    const id = crypto.randomUUID();
    
    // 1. Outbox : Persister l'intention d'émettre
    if (typeof window !== 'undefined') {
      try {
        await db.busOutbox.put({
          id,
          eventName: event,
          payload,
          createdAt: Date.now(),
          attempts: 0,
          status: 'pending'
        });
      } catch (err) {
        logger.error(`[EventBus] Failed to write to Outbox for ${event}`, err);
      }
    }

    // 2. Émettre en RAM
    await this.emit(event, payload);

    // 3. Outbox : Marquer comme terminé
    if (typeof window !== 'undefined') {
      try {
        await db.busOutbox.update(id, { status: 'done' });
      } catch (err) {
        logger.error(`[EventBus] Failed to mark Outbox as done for ${event}`, err);
      }
    }
  }

  /**
   * Émet un événement.
   *
   * Ordre d'exécution :
   * 1. CRITICAL  → await en séquence (ordre d'inscription)
   * 2. HIGH      → Promise.allSettled (parallèle)
   * 3. BACKGROUND → fire-and-forget (microtask, non-bloquant)
   *
   * Retourne quand CRITICAL + HIGH sont résolus.
   * Les erreurs BACKGROUND sont loggées sans propager.
   *
   * @param options.skipDLQWrite — true quand appelé par DLQRetryService ou
   *   handleRetry : le service de retry gère lui-même l'état de l'entrée DLQ
   *   pour éviter une double-écriture avec attempts=1.
   */
  async emit<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>,
    options?: { skipDLQWrite?: boolean }
  ): Promise<void> {
    const all = this.handlers.get(event) ?? [];
    if (all.length === 0) return;

    const critical    = all.filter(h => h.priority === 'CRITICAL');
    const high        = all.filter(h => h.priority === 'HIGH');
    const background  = all.filter(h => h.priority === 'BACKGROUND');

    const start = performance.now();

    // 1 — CRITICAL : séquentiel, bloquant
    for (const h of critical) {
      try {
        await h.handler(payload);
      } catch (err) {
        logger.error(`[EventBus][CRITICAL] ${event}#${h.id} failed`, err);
        if (typeof window !== 'undefined' && !options?.skipDLQWrite) {
          await db.deadLetterEvents.put({
            id: crypto.randomUUID(),
            eventName: event,
            payload,
            handlerId: h.id,
            error: String(err),
            failedAt: Date.now(),
            attempts: 1,
            nextRetryAt: Date.now() + 2000,
            status: 'retry'
          }).catch(e => logger.error('[EventBus] DLQ write failed', e));
        }
        throw err; // remonte — critique = non négociable
      }
    }

    // 2 — HIGH : parallèle, on attend la résolution
    if (high.length > 0) {
      const results = await Promise.allSettled(
        high.map(h => h.handler(payload))
      );
      await Promise.all(results.map(async (r, i) => {
        if (r.status === 'rejected') {
          const h = high[i];
          logger.error(`[EventBus][HIGH] ${event}#${h.id} failed`, r.reason);
          if (typeof window !== 'undefined' && !options?.skipDLQWrite) {
            await db.deadLetterEvents.put({
              id: crypto.randomUUID(),
              eventName: event,
              payload,
              handlerId: h.id,
              error: String(r.reason),
              failedAt: Date.now(),
              attempts: 1,
              nextRetryAt: Date.now() + 2000,
              status: 'retry'
            }).catch(e => logger.error('[EventBus] DLQ write failed', e));
          }
        }
      }));
    }

    // 3 — BACKGROUND : fire-and-forget
    background.forEach(h => {
      Promise.resolve().then(() => h.handler(payload)).catch(err => {
        logger.warn(`[EventBus][BACKGROUND] ${event}#${h.id} failed`, err);
      });
    });

    const ms = (performance.now() - start).toFixed(1);
    logger.info(`[EventBus] ${event} → ${all.length} handlers (${ms}ms sync)`);
  }
}

export const NexusEventBus = new NexusEventBusClass();
