import { z } from 'zod';

export const FiscalSealSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  previousHash: z.string(),
  hash: z.string(),
  timestamp: z.string().datetime(),
  dataSnapshot: z.string(), 
  signature: z.string()
});

export type FiscalSeal = z.infer<typeof FiscalSealSchema>;

export type TransactionType = 'income' | 'expense' | 'revenue' | 'tax' | 'bank' | 'payroll' | 'other';
export type AccountSide = 'debit' | 'credit';

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
    date: Date | string;
    pieceNumber: string;
    description: string;
    lines: JournalLine[];
    referenceId?: string;
    referenceType?: 'order' | 'supplier_order' | 'expense' | 'payroll' | 'bank' | 'manual';
    isSystemGenerated: boolean;
    isValidated: boolean;
    fiscalSealHash?: string;
    sealedAt?: string;
    type?: TransactionType;
    amountInCents?: number;
    status?: 'draft' | 'validated' | 'closed';
}

export interface AccountingMetrics {
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

export interface TreasuryMetrics {
    cashOnHandInCents: number;
    bankBalanceInCents: number;
    pendingReceivablesInCents: number;
    pendingPayablesInCents: number;
    netCashPositionInCents: number;
}
