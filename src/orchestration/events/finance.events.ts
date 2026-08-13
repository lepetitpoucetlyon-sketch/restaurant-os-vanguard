
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

  'finance.payment_dispatched': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    paymentBatchId: string;
    totalAmountInMicrounits: number;
    dispatchedBy: string;
    invoiceIds?: string[];
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

  // ── Restaurant vertical — NF525 ────────────────────────────────────────────
  'finance.order_sealed': { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string };
  'finance.z_report_requested': { tenantId: string; operatorId: string; requestedAt: string };
  'finance.refund_issued': { tenantId: string; referenceId: string; amountInMicrounits: number; reason: string };
  'finance.invoice_generated': { tenantId: string; invoiceId: string; invoiceNumber: string; totalInMicrounits: number; sourceJournalEntryId: string; customerName: string };

  'finance.bank_synced': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    transactionCount: number;
    syncedAt: string;
  };

  'finance.bank_disconnected': {
    v: 1;
    tenantId: string;
    provider: string;
    disconnectedAt: number;
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
    supplierId: string;
    supplierName: string;
    approvedBy: string;
  };

  'einvoice.rejected': {
    v: 1;
    tenantId: string;
    invoiceId: string;
    invoiceNumber: string;
    totalTTCInMicrounits: number;
    dueDate?: string;
    supplierId: string;
    supplierName: string;
    rejectedBy: string;
    reason: string;
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

  'einvoice.outbound_emitted': {
    v: 1;
    tenantId: string;
    internalRef: string;
    providerInvoiceId: string;
    invoiceNumber: string;
    buyerSiret: string;
    totalHTInMicrounits: number;
    totalTTCInMicrounits: number;
    clientType: string;
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
}
