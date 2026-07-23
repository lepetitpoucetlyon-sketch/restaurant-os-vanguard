/**
 * 🏛️ DOMAIN SCHEMAS BARREL - Grade X (Manual Override)
 * Re-exports with explicit disambiguation for colliding symbols.
 */

export * from './commerce';
export * from './compliance.schemas';
// finance: TaxRate/TaxRateSchema are already exported by primitives — use selective re-export to avoid collision
export {
    JournalEntrySchema, type JournalEntry,
    AccountSchema, type Account,
    LedgerAccountSchema, type LedgerAccount,
    BankTransactionSchema, type BankTransaction,
    ExpenseClaimSchema, type ExpenseClaim,
    FinancialMetricsSchema, AccountingMetricsSchema,
    type FinancialMetrics, type AccountingMetrics,
    TreasuryMetricsSchema, type TreasuryMetrics,
    AccountingContextSchema, type AccountingContextData,
    FiscalSealSchema, type FiscalSeal
} from './finance';
export * from './haccp';
export * from './hr';
export * from './inventory';
export * from './modules';
export * from './ops';
export * from './orders';
export * from './pos';
export * from './primitives';
export * from './quality';
export * from './supplier-invoice.schemas';
export * from './tenant';
export * from './ui';
export * from './users';
