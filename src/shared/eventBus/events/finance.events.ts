export interface FINANCEEvents {
  "finance.bank_connection_expired": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    connectionId: string;
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

  'finance.food_cost_impacted': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reason: string;
    affectedItems?: string[];
    impactDate: string;
  };

  'finance.material_cost_impacted': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reason: string;
    affectedItems?: string[];
    impactDate: string;
  };

  'finance.cogs_impacted': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reason: string;
    affectedItems?: string[];
    impactDate: string;
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

  'finance.invoice_approved': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    invoiceId: string;
    supplierId: string;
    amountInMicrounits: number;
    approvedBy: string;
  };

  'finance.purchase_variance_detected': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    supplierId: string;
    invoiceId: string;
    receiptId: string;
    stockItemId: string;
    quantity: number;
    provisionalPriceCts: number;
    actualPriceCts: number;
    varianceAmountCts: number;
    reconciledBy?: string;
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

  'finance.ticket_z_closed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    date: string;
    totalInMicrounits: number;
    ordersCount: number;
    occurredAt?: string;
    businessDay?: string;
  };

  'finance.period_closed_batch': {
    v: 1;
    tenantId: string;
    fromDay: string;
    toDay: string;
    closedDays: string[];
    skippedDays: string[];
    totalInMicrounits: number;
    totalOrdersCount: number;
    operatorId: string;
  };

  'finance.daily_audit': {
    v: 1;
    tenantId: string;
    date: string;
    occurredAt?: string;
    businessDay?: string;
  };

  'finance.month_closed': {
    v: 1;
    tenantId: string;
    month: string; // YYYY-MM
  };

  'finance.tax_mismatch': {
    v: 1;
    tenantId: string;
    orderId?: string;
    expectedTax: number;
    actualTax: number;
    date: string;
  };

  'supplier.delivery_received': {
    v: 1;
    tenantId: string;
    supplierId: string;
    orderId: string;
  };

  'finance.order_sealed': { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string };
  'finance.z_report_requested': { tenantId: string; operatorId: string; requestedAt: string };
  'finance.refund_issued': { tenantId: string; referenceId: string; amountInMicrounits: number; reason: string };
  'finance.transfer_proposed': {
    v: 1;
    tenantId: string;
    debitAccount: string;
    creditAccount: string;
    amountInCents: number;
    referenceId: string;
    description: string;
    source: string;
  };
  'stripe.deposit_received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    depositId: string;
    amountInMicrounits: number;
    reservationId?: string;
    customerId?: string;
    paidAt: number;
  };

  'payment.rejected': {
    v: 1;
    tenantId: string;
    orderId: string;
    reason: string;
    amountInMicrounits: number;
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

  'finance.giftcard_locked': {
    v: 1;
    tenantId: string;
    giftcardId: string;
    lockedBy: 'pos' | 'web';
    orderId?: string;
    amountInMicrounits: number;
    expiresAt: number;
  };

  'finance.provisional_seal_created': { v:1; tenantId: string; orderId: string; operatorId: string; totalInMicrounits: number; sealedAt: number };

  'finance.provisional_seal_annulled': { v:1; tenantId: string; orderId: string; actorId: string; reason: string; annulledAt: number };

  'finance.addon_ticket_created': { v:1; tenantId: string; parentSealId: string; addonOrderId: string; addonTotalInMicrounits: number; createdAt: number };

  'finance.advance_invoice_issued': { v:1; tenantId: string; invoiceId: string; orderId: string; amountInMicrounits: number; tvaInMicrounits: number; issuedAt: number };

  'finance.cash_variance_recorded': { v:1; tenantId: string; dateIso: string; expectedInMicrounits: number; actualInMicrounits: number; varianceInMicrounits: number; account: '658' | '757'; recordedAt: number };

  'finance.change_as_tip': { v:1; tenantId: string; orderId: string; changeInMicrounits: number; tipInMicrounits: number; operatorId: string; recordedAt: number };

  'finance.tpe_reconciliation_blocked': { v:1; tenantId: string; orderId: string; tpeTransactionId: string; tpeStatus: string; blockedAt: number };

  'finance.ticket_z_missing': { v:1; tenantId: string; missingDateIso: string; detectedAt: number };

  'finance.grand_total_sealed': { v:1; tenantId: string; period: 'monthly' | 'annual'; periodLabel: string; totalInMicrounits: number; hash: string; sealedAt: number };

  'finance.tva_livraison_mismatch': { v:1; tenantId: string; orderId: string; consumptionMode: string; providedTaxRate: string; expectedTaxRate: string; detectedAt: number };

  'finance.dunning_email_sent': { v:1; tenantId: string; invoiceId: string; step: 'j3' | 'j7' | 'j14'; emailRecipient: string; sentAt: number };

  'finance.tenant_suspended_unpaid': { v:1; tenantId: string; invoiceId: string; overduedays: number; suspendedAt: number };

  'finance.complementary_invoice_created': { v:1; tenantId: string; invoiceId: string; originalOrderId: string; customerName: string; deadlineAt: number; createdAt: number };

  'finance.antidated_invoice_blocked': { v:1; tenantId: string; issuedBy: string; invoiceDateIso: string; backdateDays: number; blockedAt: number };

  'finance.reseller_commission_generated': { v:1; resellerId: string; periodLabel: string; totalCommissionInMicrounits: number; tenantCount: number; generatedAt: number };

  'finance.cash_pool_balanced': { v:1; groupTenantId: string; fromTenantId: string; toTenantId: string; transferAmountInMicrounits: number; balancedAt: number };

  'finance.smart_tip_distributed': { v:1; tenantId: string; periodLabel: string; totalPoolInMicrounits: number; beneficiaryCount: number; distributedAt: number };

  // ── Facturation légale (§7.4/7.7 extrait antigravity) ────────────────────
  'finance.invoice_generated': {
    tenantId: string;
    invoiceId: string;
    invoiceNumber: string;
    totalInMicrounits: number;
    sourceJournalEntryId: string;
    customerName?: string;
  };

  // ── E-facturation Factur-X (obligation FR sept. 2026) ─────────────────────
  // Extraits de agent/antigravity-exec §7.3, câblés sur main 2026-08-31.

  'einvoice.outbound_emitted': {
    v: 1;
    tenantId: string;
    internalRef: string;
    providerInvoiceId: string;
    invoiceNumber: string;
    buyerSiret: string;
    totalHTInMicrounits: number;
    totalTTCInMicrounits: number;
    clientType?: string;
  };

  'einvoice.outbound_status_updated': {
    v: 1;
    tenantId: string;
    internalRef: string;
    providerInvoiceId: string;
    invoiceNumber: string;
    newStatus: string;
    totalTTCInMicrounits: number;
  };

  'einvoice.validated': {
    v: 1;
    tenantId: string;
    invoiceId: string;
    invoiceNumber: string;
    totalTTCInMicrounits: number;
    validatedBy: string;
  };

  'einvoice.approved': {
    v: 1;
    tenantId: string;
    invoiceId: string;
    invoiceNumber: string;
    totalHTInMicrounits: number;
    totalTTCInMicrounits: number;
    dueDate?: string;
    supplierId?: string;
    supplierName?: string;
    approvedBy?: string;
  };

  'einvoice.rejected': {
    v: 1;
    tenantId: string;
    invoiceId: string;
    invoiceNumber: string;
    totalTTCInMicrounits: number;
    dueDate?: string;
    supplierId?: string;
    supplierName?: string;
    reason?: string;
    rejectionReason?: string;
    rejectedBy?: string;
  };

  'einvoice.paid': {
    v: 1;
    tenantId: string;
    invoiceId: string;
    invoiceNumber: string;
    totalTTCInMicrounits: number;
    supplierId: string;
    paidBy: string;
    paymentReference: string;
  };

  'einvoice.goods_received': {
    v: 1;
    tenantId: string;
    invoiceId: string;
    deliveryNoteId: string;
    receivedBy: string;
    items: Array<{
      productId: string;
      quantityReceived: number;
      quantityExpected: number;
      accepted: boolean;
      rejectionReason?: string;
    }>;
    allAccepted: boolean;
  };
}
