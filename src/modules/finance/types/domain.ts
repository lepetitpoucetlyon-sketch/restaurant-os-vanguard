import { z } from 'zod';
import { 
  JournalEntry as KernelJournalEntry, 
  JournalLine as KernelJournalLine,
  AccountSide as KernelAccountSide,
  TransactionCategory as KernelTransactionCategory,
  FiscalSeal as KernelFiscalSeal,
  FinancialMetrics as KernelFinancialMetrics
} from '@nexus/contracts/finance.types';

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

/** Un point de la courbe de flux de trésorerie journalier. */
export interface TreasuryTrendPoint {
    /** Timestamp du début de journée (ms). */
    date: number;
    /** Flux net du jour (produits − charges), en microunits. */
    netInMicrounits: number;
}

/**
 * Instantané de trésorerie (cash-flow) — TOUT en microunits (convention Restaurant OS).
 * Distinct de TreasuryMetrics (résumé P&L Zod) : ici c'est la position de CASH.
 * Calculé par TreasuryCalculator à partir des écritures Nexus (plan PCG) :
 *   53x → caisse · 512x → banque · 411x → créances clients · 401x → dettes fournisseurs
 */
export interface TreasurySnapshot {
    cashOnHandInMicrounits: number;
    bankBalanceInMicrounits: number;
    pendingReceivablesInMicrounits: number;
    pendingPayablesInMicrounits: number;
    netCashPositionInMicrounits: number;
    /** Projection linéaire à 30 jours de la position de trésorerie. */
    forecast30DaysInMicrounits: number;
    /** Flux net des 14 derniers jours, du plus ancien au plus récent. */
    cashFlowTrend: TreasuryTrendPoint[];
}
