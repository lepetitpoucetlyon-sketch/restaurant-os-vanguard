/**
 * 🏛️ DOMAIN SCHEMAS BARREL — Grade X
 * Pass-through vers les piliers. Source of truth dans modules/<pilier>/domain/schemas/.
 * Re-exports sélectifs uniquement pour éviter les collisions de symboles.
 */

// ── Transversaux (restent ici) ───────────────────────────────────────────────
export * from './primitives';
export * from './tenant';
export * from './users';
export * from './ui';
export * from './modules';

// ── ops ──────────────────────────────────────────────────────────────────────
export * from './pos';
export * from './ops';
export * from './orders';
export * from './cash';

// ── finance ──────────────────────────────────────────────────────────────────
// TaxRate/TaxRateSchema déjà exportés par primitives — export sélectif pour éviter collision
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
    FiscalSealSchema, type FiscalSeal,
} from './finance';
export * from './periodClosure';

// ── logistics ────────────────────────────────────────────────────────────────
export * from './inventory';
export * from './supplier-invoice.schemas';

// ── compliance ───────────────────────────────────────────────────────────────
export * from './haccp';
export * from './quality';
export * from './compliance.schemas';
export * from './foodDonation';
export * from './audit';
export * from './pii';
export * from './policy';
export * from './rbac';
export * from './license';

// ── human ────────────────────────────────────────────────────────────────────
export * from './hr';
// DocumentType collision avec supplier-invoice → alias explicite pour le type RH
export {
    DocumentTypeSchema as EmployeeDocumentTypeSchema,
    EmployeeDocumentSchema,
    type EmployeeDocument,
    type DocumentType as EmployeeDocumentType,
} from './employeeDocument';

// ── commerce ─────────────────────────────────────────────────────────────────
export * from './commerce';
export * from './loyalty';
export * from './giftcard';
export * from './customerAccount';

// ── intelligence ─────────────────────────────────────────────────────────────
export * from './supportTicket';
