import { z } from 'zod';
import { MicrounitsSchema, TimestampSchema, UUIDSchema, sanitized } from '@/shared/schemas/primitives';

// ── Taux TVA légaux France ─────────────────────────────────────────────────
export const TaxRateSchema = z.enum(['0.00', '0.021', '0.055', '0.10', '0.20'])
  .describe('Taux TVA légaux France : 0% (médical/exonéré) / 2.1% (presse) / 5.5% / 10% / 20%');

export type TaxRate = z.infer<typeof TaxRateSchema>;


// ── Journal Entry NF525 ────────────────────────────────────────────────────
/**
 * JournalEntrySchema — Schéma de VALIDATION NF525 (couche entrée/API)
 *
 * ⚠️  Ce schéma sert à valider les données AVANT écriture.
 *     Il n'est PAS le type de stockage Firestore.
 *
 * Pour le type de stockage/affichage, utiliser :
 *   import type { JournalEntry } from '@nexus/contracts'   (finance.types.ts)
 *
 * Pour la validation d'entrée (API, Bridge), utiliser ce schéma :
 *   JournalEntrySchema.parse(data)
 */
// ── Ligne d'écriture comptable (Partie double NF525 / PCG) ──────────────────
export const JournalLineSchema = z.object({
  id:                         UUIDSchema.optional(),
  accountId:                  z.string().optional(),
  accountCode:                z.string().optional(),
  accountName:                z.string().optional(),
  description:                z.string().optional(),
  side:                       z.enum(['debit', 'credit']).default('debit'),
  amountInCents:              z.number().int().optional(),
  amountInMicrounits:         MicrounitsSchema.optional(),
  date:                       TimestampSchema.optional(),
  pieceNumber:                z.string().optional(),
  debitInCents:               z.number().int().optional(),
  debitInMicrounits:          MicrounitsSchema.optional(),
  creditInCents:              z.number().int().optional(),
  creditInMicrounits:         MicrounitsSchema.optional(),
  runningBalanceInCents:      z.number().optional(),
  runningBalanceInMicrounits: MicrounitsSchema.optional(),
  vatRate:                    TaxRateSchema.optional(),
  reference:                  z.string().optional(),
  journalCode:                z.string().optional(),
});

export type JournalLine = z.infer<typeof JournalLineSchema>;

export const JournalEntrySchema = z.object({
  id:                 UUIDSchema,
  receiptNumber:      z.string()
    .regex(/^[0-9]{4}-[0-9]{6,}$/, 'Format numéro NF525 invalide'),
  hashPrecedent:      z.string()
    .length(64, 'Hash SHA256 doit faire 64 caractères'),
  hash:               z.string()
    .length(64, 'Hash SHA256 doit faire 64 caractères'),
  amountInMicrounits: MicrounitsSchema,
  taxRate:            TaxRateSchema,
  taxAmountInMicrounits: MicrounitsSchema,
  operatorId:         UUIDSchema,
  deviceId:           z.string().min(1),
  serverTimestamp:    TimestampSchema,
  correlationId:      UUIDSchema,
  type:               z.enum(['revenue', 'expense', 'tax', 'other']),
  status:             z.enum(['draft', 'pending', 'validated', 'closed', 'cancelled', 'refunded']).optional(),
  date:               TimestampSchema.optional(), // Added for interface parity
  pieceNumber:        z.string().optional(),       // Added for interface parity
  description:        z.string().default(''),      // Added for interface parity
  lines:              z.array(JournalLineSchema).default([]),
  isValidated:        z.boolean().default(true),    // NF525 Requirement
  isSystemGenerated:  z.boolean().default(false),   // Audit requirement
  updatedAt:          TimestampSchema.optional(),   // Interface parity
  cancellationRef:    UUIDSchema.optional(),
}).refine(
  data => data.hash !== data.hashPrecedent,
  { message: 'Hash et hashPrecedent ne peuvent pas être identiques', path: ['hash'] }
).refine(
  data => data.taxAmountInMicrounits <= data.amountInMicrounits,
  { message: 'La TVA ne peut pas dépasser le montant total', path: ['taxAmountInMicrounits'] }
).refine(
  data => {
    // Si des lignes avec débits/crédits explicites sont fournies (>= 2 lignes), valider la partie double
    if (data.lines && data.lines.length >= 2) {
      const hasExplicitDebitCredit = data.lines.some(l => (l.debitInMicrounits ?? l.debitInCents ?? 0) > 0 || (l.creditInMicrounits ?? l.creditInCents ?? 0) > 0);
      if (hasExplicitDebitCredit) {
        const totalDebit = data.lines.reduce((sum, l) => sum + (l.debitInMicrounits ?? (l.debitInCents ? l.debitInCents * 10_000 : 0)), 0);
        const totalCredit = data.lines.reduce((sum, l) => sum + (l.creditInMicrounits ?? (l.creditInCents ? l.creditInCents * 10_000 : 0)), 0);
        return totalDebit === totalCredit;
      }
    }
    return true;
  },
  { message: 'VIOLATION NF525 : Débit !== Crédit (Écriture comptable déséquilibrée)', path: ['lines'] }
);

export type JournalEntry = z.infer<typeof JournalEntrySchema>;

// ── Account / Ledger ───────────────────────────────────────────────────────
export const AccountSchema = z.object({
  id:            UUIDSchema,
  code:          z.string().regex(/^[0-9]{3,6}$/, 'Code comptable PCG invalide'),
  name:          sanitized(1, 100),
  type:          z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  class:         z.enum(['1', '2', '3', '4', '5', '6', '7']).default('1'), // Added for interface parity
  balanceInMicrounits: z.number().int(),  // Peut être négatif (dette)
  balanceInCents: z.number().int().optional(), // Added for interface parity
  currency:      z.literal('EUR').default('EUR'),
  isActive:      z.boolean().default(true),
  parentCode:    z.string().optional(),
  siteId:        UUIDSchema,
  updatedAt:     TimestampSchema,
});

export type Account = z.infer<typeof AccountSchema>;

export const LedgerAccountSchema = AccountSchema.extend({
  entries:       z.array(JournalEntrySchema).default([]),
  totalDebit:    MicrounitsSchema,
  totalCredit:   MicrounitsSchema,
}).refine(
  data => data.totalDebit >= 0 && data.totalCredit >= 0,
  { message: 'Les totaux débit/crédit ne peuvent pas être négatifs' }
);

export type LedgerAccount = z.infer<typeof LedgerAccountSchema>;

// ── Bank Transaction ───────────────────────────────────────────────────────
export const BankTransactionSchema = z.object({
  id:             UUIDSchema,
  externalRef:    sanitized(1, 50),
  amountInMicrounits: z.number().int(), // Peut être négatif (débit)
  direction:      z.enum(['credit', 'debit']),
  description:    sanitized(0, 200),
  executedAt:     TimestampSchema,
  date:           TimestampSchema.optional(), // Interface parity
  label:          sanitized(0, 200).default(''), // Interface parity
  amountInCents:  z.number().int().optional(), // Interface parity
  type:           z.enum(['credit', 'debit']).optional(), // Interface parity
  reconciledAt:   TimestampSchema.optional(),
  journalEntryId: UUIDSchema.optional(),
  bankRef:        sanitized(0, 50),
  siteId:         UUIDSchema,
}).refine(
  data => {
    if (data.direction === 'debit')  return data.amountInMicrounits < 0;
    if (data.direction === 'credit') return data.amountInMicrounits > 0;
    return true;
  },
  { message: 'Le signe du montant doit correspondre à la direction', path: ['amountInMicrounits'] }
);

export type BankTransaction = z.infer<typeof BankTransactionSchema>;

// ── Expense Claim ──────────────────────────────────────────────────────────
export const ExpenseClaimSchema = z.object({
  id:              UUIDSchema,
  submittedBy:     UUIDSchema,
  approvedBy:      UUIDSchema.optional(),
  amountInMicrounits: MicrounitsSchema,
  category:        z.enum([
    'food', 'equipment', 'maintenance', 'utilities',
    'marketing', 'training', 'travel', 'other'
  ]),
  description:     sanitized(1, 300),
  receiptUrl:      z.string().url().optional(),
  status:          z.enum(['pending', 'approved', 'rejected', 'reimbursed']),
  submittedAt:     TimestampSchema,
  date:            TimestampSchema.optional(), // Interface parity
  userId:          UUIDSchema.optional(),      // Interface parity
  userName:        z.string().default('Unknown'), // Interface parity
  userRole:        z.string().default('employee'), // Interface parity
  amountInCents:   z.number().int().optional(), // Interface parity
  processedAt:     TimestampSchema.optional(),
}).refine(
  data => !(data.status === 'approved' && data.approvedBy === null),
  { message: 'Une note de frais approuvée doit avoir un approbateur', path: ['approvedBy'] }
).refine(
  data => !(data.status !== 'pending' && data.processedAt === null),
  { message: 'Une note de frais traitée doit avoir une date de traitement', path: ['processedAt'] }
);

export type ExpenseClaim = z.infer<typeof ExpenseClaimSchema>;

// ── Financial Metrics ──────────────────────────────────────────────────────
export const FinancialMetricsSchema = z.object({
  totalRevenue:    z.number().int(),
  totalExpenses:   z.number().int(),
  netProfit:       z.number().int(),
  margin:          z.number(),
  period:          z.string(),
});

export const AccountingMetricsSchema = z.object({
  unreconciledCount: z.number().int(),
  pendingClaimsCount: z.number().int(),
  lastClosureDate:    TimestampSchema.nullable(),
  fiscalHealthScore:  z.number().min(0).max(100),
});

export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>;
export type AccountingMetrics = z.infer<typeof AccountingMetricsSchema>;

// ── Treasury Metrics ───────────────────────────────────────────────────────
export const TreasuryMetricsSchema = z.object({
  totalRevenueInMicrounits:   MicrounitsSchema,
  totalExpensesInMicrounits:  MicrounitsSchema,
  netProfitInMicrounits:      z.number().int(), // Peut être négatif
  marginRate:                 z.number().min(-1).max(1), // -100% à +100%
  forecastedRevenueInMicrounits: MicrounitsSchema,
  cashPositionInMicrounits:   z.number().int(),
  periodStart:                TimestampSchema,
  periodEnd:                  TimestampSchema,
}).refine(
  data => data.periodEnd > data.periodStart,
  { message: 'periodEnd doit être postérieur à periodStart', path: ['periodEnd'] }
).refine(
  data => {
    const computed = data.totalRevenueInMicrounits - data.totalExpensesInMicrounits;
    return Math.abs(computed - data.netProfitInMicrounits) < 1000; // Tolérance 1 microunité
  },
  { message: 'netProfit ne correspond pas à revenue - expenses', path: ['netProfitInMicrounits'] }
);

export type TreasuryMetrics = z.infer<typeof TreasuryMetricsSchema>;

// ── Treasury Snapshot (cash-flow) ──────────────────────────────────────────
// Sortie CALCULÉE (TreasuryCalculator), pas une donnée Firestore validée :
// interfaces simples plutôt que schémas Zod. Tout en microunits.
export interface TreasuryTrendPoint {
  /** Timestamp du début de journée (ms). */
  date: number;
  /** Flux net du jour (produits − charges), en microunits. */
  netInMicrounits: number;
}

/**
 * Position de trésorerie (cash) — distincte de TreasuryMetrics (résumé P&L).
 * PCG : 53x caisse · 512x banque · 411x créances clients · 401x dettes fournisseurs.
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

// ── Accounting Context State (Data only) ───────────────────────────────────
export const AccountingContextSchema = z.object({
  journalEntries:   z.array(JournalEntrySchema),
  accounts:         z.array(AccountSchema),
  bankTransactions: z.array(BankTransactionSchema),
  expenseClaims:    z.array(ExpenseClaimSchema),
  treasury:         TreasuryMetricsSchema.nullable(),
  isLoading:        z.boolean(),
  error:            z.string().nullable(),
  viewMode:         z.enum(['simple', 'expert']),
});

export type AccountingContextData = z.infer<typeof AccountingContextSchema>;

// ── Fiscal Seal ────────────────────────────────────────────────────────────
export const FiscalSealSchema = z.object({
  hash:          z.string().length(64),
  previousHash:  z.string().length(64),
  timestamp:     z.string(), // ISO String
  signature:     z.string(),
  sequence:      z.number().int().optional(),
  instanceId:    z.string().optional(),
  updatedAt:     TimestampSchema,
});

export type FiscalSeal = z.infer<typeof FiscalSealSchema>;
