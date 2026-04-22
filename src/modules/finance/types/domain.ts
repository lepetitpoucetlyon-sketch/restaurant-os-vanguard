import { z } from 'zod';
import { 
  JournalEntry as KernelJournalEntry, 
  JournalLine as KernelJournalLine,
  AccountSide as KernelAccountSide,
  TransactionCategory as KernelTransactionCategory,
  FiscalSeal as KernelFiscalSeal,
  FinancialMetrics as KernelFinancialMetrics
} from '@/shared/types/finance.types';

export const FiscalSealSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  previousHash: z.string(),
  hash: z.string(),
  timestamp: z.string().datetime(),
  dataSnapshot: z.string(), 
  signature: z.string()
});

export type FiscalSeal = KernelFiscalSeal;
export type JournalEntry = KernelJournalEntry;
export type JournalLine = KernelJournalLine;
export type AccountSide = KernelAccountSide;
export type TransactionType = KernelTransactionCategory;
export type TransactionCategory = KernelTransactionCategory;

export type AccountingMetrics = KernelFinancialMetrics;

export interface TreasuryMetrics {
    cashOnHandInCents: number;
    bankBalanceInCents: number;
    pendingReceivablesInCents: number;
    pendingPayablesInCents: number;
    netCashPositionInCents: number;
}
