/**
 * 🧾 FINANCE DOMAIN - Shared Kernel
 * Version Grade X - Sovereign Alignment
 */

export type TransactionCategory = 
  | 'revenue' | 'expense' | 'purchases' | 'fixed' | 'payroll' | 'bank' | 'tax' | 'other' | 'loss' | 'sales';

export type AccountSide = 'debit' | 'credit';

export interface FiscalSeal {
    [key: string]: import('@shared/nexus-contract').SovereignField | undefined;
    id?: string;
    hash: string;
    previousHash: string;
    sequence?: number;
    signedPayload?: string;
    signature?: string; // Union with legacy
    algorithm?: string;
    timestamp?: string;
    dataSnapshot?: string;
    transactionId?: string;
}

export interface JournalLine {
    accountId: string;
    accountCode: string;
    accountName: string;
    description: string;
    side: AccountSide;
    amountInCents: number;
}

export interface JournalEntry {
    id: string;
    date: string | Date;
    pieceNumber: string;
    description: string;
    lines: JournalLine[];
    referenceId?: string;
    referenceType?: 'order' | 'supplier_order' | 'expense' | 'payroll' | 'bank' | 'manual' | 'oms';
    isSystemGenerated: boolean;
    isValidated: boolean;
    fiscalSealHash?: string;
    sealedAt?: string;
    type?: TransactionCategory;
    amountInCents?: number;
    status?: 'draft' | 'validated' | 'closed' | 'pending';
}

export interface TaxBreakdown {
    total: number;
    ht: number;
    totalTax: number;
    rates: Record<number, number>;
}

export interface ZReport {
    id: string;
    type: 'Z_REPORT';
    date: string;
    tenantId: string;
    ordersCount: number;
    totalInCents: number;
    taxBreakdown: TaxBreakdown;
    timestamp: string;
    _fiscalSeal?: FiscalSeal;
}

export interface FinancialMetrics {
    totalRevenueInCents: number;
    totalExpensesInCents: number;
    grossMarginInCents: number;
    grossMarginPercent: number;
    foodCostPercent: number;
    laborCostPercent: number;
    operatingExpensesInCents: number;
    ebitdaInCents: number;
    netProfitInCents: number;
}
