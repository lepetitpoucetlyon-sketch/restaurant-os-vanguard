// src/modules/finance/types.ts — APRÈS migration
// Ce fichier devient un re-export pur. La vérité est dans les schémas.

export type {
  JournalEntry,
  Account,
  LedgerAccount,
  BankTransaction,
  ExpenseClaim,
  TreasuryMetrics,
  TreasurySnapshot,
  TreasuryTrendPoint,
  TaxRate,
  AccountingMetrics,
  FinancialMetrics,
  FiscalSeal,
} from './domain/schemas/finance';

export {
  JournalEntrySchema,
  AccountSchema,
  LedgerAccountSchema,
  BankTransactionSchema,
  ExpenseClaimSchema,
  TreasuryMetricsSchema,
  TaxRateSchema,
  AccountingMetricsSchema,
  FinancialMetricsSchema,
  FiscalSealSchema,
} from './domain/schemas/finance';

// Schémas partiels pour mutations
export {
  JournalEntrySchema as JournalEntryPatchSchema,
} from './domain/schemas/finance';

// --- Legacy Exports (to be removed once fully migrated) ---
export type AccountClass = '1' | '2' | '3' | '4' | '5' | '6' | '7';
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type FiscalPeriodStatus = 'open' | 'closed' | 'locked';

export interface FiscalPeriod {
    id: string;
    name: string;           
    startDate: Date | string;
    endDate: Date | string;
    status: FiscalPeriodStatus;
    closedAt?: Date | string;
    closedBy?: string;
}

export interface BankConnection {
    id: string;
    provider: 'plaid' | 'bridge' | 'manual';
    institutionName: string;
    status: 'active' | 'error' | 'disconnected';
    lastSyncAt: Date | string;
}

export interface FiscalAuditResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    periodCovered: { start: Date | string; end: Date | string };
    integrityHash: string;
}

export interface ComplianceCertificate {
    id: string;
    type: 'NF525' | 'ISO27001' | 'HACCP';
    issuedBy: string;
    issuedAt: Date | string;
    expiryDate: Date | string;
    documentUrl: string;
}

// NOTE: AccountingContextType remains manual for now as it describes the React context API,
// but it should use the new types.
import type { 
    Account, 
    JournalEntry, 
    ExpenseClaim,
    AccountingContextData
} from './domain/schemas/finance';
import { SovereignData, SovereignValue } from '@nexus/contracts/nexus-contract';

export interface AccountingContextType extends AccountingContextData {
    // Actions
    toggleViewMode: () => void;
    
    addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
    updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
    // NF525 : pas de deleteJournalEntry — le ledger fiscal est immuable (jamais delete).
    validateJournalEntry: (id: string) => Promise<void>;
    
    addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
    updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
    
    submitExpenseClaim: (claim: Partial<ExpenseClaim>, receiptBlob?: string) => Promise<void>;
    approveExpenseClaim: (id: string) => Promise<void>;
    rejectExpenseClaim: (id: string) => Promise<void>;
    
    reconcileTransaction: (bankTxId: string, journalEntryId: string) => Promise<void>;
    linkBankConnection: (connectionData: Partial<BankConnection>) => Promise<void>;
    
    expert: {
        queryExpert: (prompt: string, contextData?: SovereignData) => Promise<SovereignValue>;
        isConfigured: boolean;
        isAuthorized: boolean;
    };
}
