import type { CartItem } from '@/modules/ops/workflow/engine/types';

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
}
