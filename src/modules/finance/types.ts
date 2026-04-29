import { z } from 'zod';
import { SovereignData, SovereignValue } from '@/shared/nexus-contract';
import { 
  JournalEntry as KernelJournalEntry, 
  JournalLine as KernelJournalLine,
  AccountSide as KernelAccountSide,
  TransactionCategory as KernelTransactionCategory,
  FiscalSeal as KernelFiscalSeal,
  FinancialMetrics as KernelFinancialMetrics
} from '@/shared/types/finance.types';

/**
 * ACCOUNTING & FINANCE TYPES - Professional ERP
 * Version Grade X - Sovereign Alignment
 */

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

// --- Account Types (PCG Classes 1-7) ---
export type AccountClass = '1' | '2' | '3' | '4' | '5' | '6' | '7';
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountSide = KernelAccountSide;
export type TransactionType = KernelTransactionCategory;
export type TransactionCategory = KernelTransactionCategory;

// --- Chart of Accounts (Plan Comptable Général) ---
export interface Account {
    id: string;
    code: string;          
    name: string;
    type: AccountType;
    class: AccountClass;
    parentCode?: string;   
    isActive: boolean;
    description?: string;
    balanceInCents?: number; // Grade X Sovereign Balance Tracking
}

// --- Journal Entries (Écritures Comptables) ---
export type JournalLine = KernelJournalLine;
export type JournalEntry = KernelJournalEntry;

// --- Ledger (Grand Livre) ---
export interface LedgerAccount extends Account {
    balanceInCents: number;
    debitTotalInCents: number;
    creditTotalInCents: number;
    movements: LedgerMovement[];
}

export interface LedgerMovement {
    date: Date | string;
    pieceNumber: string;
    description: string;
    debitInCents: number;
    creditInCents: number;
    runningBalanceInCents: number;
    journalEntryId: string;
}

// --- Fiscal Periods (Périodes Comptables) ---
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

// --- Expense Claims (Notes de Frais) ---
export interface ExpenseClaim {
    id: string;
    userId: string;
    userName: string;
    userRole: string; 
    date: string; // Grade X: ISO string enforced for determinism
    amountInCents: number;
    category: string; // Grade X: Normalized string
    description: string;
    invoiceId?: string; // Grade X: Business Unique Identifier
    receiptUrl?: string; 
    receiptImage?: string; 
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    journalEntryId?: string;
    ocrData?: {
        merchant?: string;
        taxAmountInCents?: number;
        confidence?: number;
        isFacturXCertified?: boolean; 
        fiscalNetworkId?: string; 
    };
}

// --- Bank Reconciliation (Rapprochement Bancaire) ---
export interface BankTransaction {
    id: string;
    date: Date | string;
    label: string;
    amountInCents: number;
    amount?: number; 
    type: 'credit' | 'debit';
    isReconciled: boolean;
    reconciledWith?: string; 
    reconciledAt?: Date | string;
    signature?: string;    
}

export interface BankReconciliation {
    id: string;
    periodId: string;
    bankBalanceInCents: number;
    ledgerBalanceInCents: number;
    differenceInCents: number;
    status: 'pending' | 'balanced' | 'discrepancy';
    createdAt: Date | string;
}

// --- Financial Metrics ---
export interface TreasuryMetrics {
    cashOnHandInCents: number;
    bankBalanceInCents: number;
    pendingReceivablesInCents: number;
    pendingPayablesInCents: number;
    netCashPositionInCents: number;
    cashFlowTrend: { 
        date: string; 
        inflowInCents: number; 
        outflowInCents: number;
        inflow: number;  
        outflow: number; 
    }[];
    forecast30DaysInCents: number;
    
    // UI Aliases (DEPRECATED)
    cashOnHand: number;
    bankBalance: number;
    pendingReceivables: number;
    pendingPayables: number;
    netCashPosition: number;
    forecast30Days: number;
}

export type AccountingMetrics = KernelFinancialMetrics;

// --- Financial Reports ---
export interface ProfitAndLossReport {
    periodId: string;
    periodName: string;
    revenues: { accountCode: string; accountName: string; amountInCents: number }[];
    expenses: { accountCode: string; accountName: string; amountInCents: number }[];
    totalRevenueInCents: number;
    totalExpensesInCents: number;
    netResultInCents: number;
    generatedAt: Date | string;
}

export interface BalanceSheetReport {
    asOfDate: Date | string;
    assets: { accountCode: string; accountName: string; amountInCents: number }[];
    liabilities: { accountCode: string; accountName: string; amountInCents: number }[];
    equity: { accountCode: string; accountName: string; amountInCents: number }[];
    totalAssetsInCents: number;
    totalLiabilitiesInCents: number;
    totalEquityInCents: number;
    isBalanced: boolean;
    generatedAt: Date | string;
}

export interface TrialBalance {
    periodId: string;
    accounts: { code: string; name: string; debitInCents: number; creditInCents: number }[];
    totalDebitInCents: number;
    totalCreditInCents: number;
    isBalanced: boolean;
}

export type FinanceFinancialMetrics = KernelFinancialMetrics;
export type FinancialMetrics = KernelFinancialMetrics;

export interface Transaction {
    id: string;
    type: TransactionType;
    category: TransactionCategory;
    title: string;
    amountInCents: number;
    date: Date | string;
    orderId?: string;
    supplierOrderId?: string;
    expenseClaimId?: string;
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

export interface AccountingContextType {
    accounts: Account[];
    journalEntries: JournalEntry[];
    bankTransactions: BankTransaction[];
    bankConnections: BankConnection[];
    expenseClaims: ExpenseClaim[];
    fiscalPeriods: FiscalPeriod[];
    ledger: LedgerAccount[];
    metrics: AccountingMetrics;
    legacyMetrics: FinanceFinancialMetrics;
    isLoading: boolean;
    
    // UI State
    viewMode: 'simple' | 'expert';
    toggleViewMode: () => void;
    
    // Actions
    addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
    addManualJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
    updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
    deleteJournalEntry: (id: string) => Promise<void>;
    validateJournalEntry: (id: string) => Promise<void>;
    
    addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
    updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
    
    submitExpenseClaim: (claim: Omit<ExpenseClaim, 'id' | 'userId' | 'userName' | 'status' | 'date' | 'userRole'>, receiptBlob?: string) => Promise<void>;
    approveExpenseClaim: (id: string) => Promise<void>;
    rejectExpenseClaim: (id: string) => Promise<void>;
    
    reconcileTransaction: (bankTxId: string, journalEntryId: string) => Promise<void>;
    linkBankConnection: (connectionData: Partial<BankConnection>) => Promise<void>;
    recordPayrollSalary: (userId: string, netAmount: number, socialCharges: number, month: string) => Promise<void>;
    submitExpense: (claim: Partial<ExpenseClaim>) => Promise<void>;
    ingestTransactions: (transactions: BankTransaction[]) => Promise<void>;
    
    generatePandL: (periodId: string) => ProfitAndLossReport;
    generateBalanceSheet: (date: Date) => BalanceSheetReport;
    generateTrialBalance: (periodId: string) => TrialBalance;
    
    getLedger: (accountId: string) => LedgerAccount | null;
    getLedgerForAccount: (id: string) => LedgerMovement[];
    getAccountByCode: (code: string) => Account | undefined;
    getMetrics: () => AccountingMetrics;
    getCalculatedFinancialMetrics: () => FinanceFinancialMetrics;
    
    // Expert/AI
    expert: {
        queryExpert: (prompt: string, contextData?: SovereignData) => Promise<SovereignValue>;
        isConfigured: boolean;
        isAuthorized: boolean;
        role: string;
        modelId: string;
    };
    agent: {
        query: (prompt: string, context?: SovereignData) => Promise<SovereignValue>;
        isProcessing: boolean;
    };

    // Fiscal & Compliance
    generateAnnualFEC: (year: number, siren?: string) => Promise<void>;
    runFiscalAudit: () => Promise<FiscalAuditResult>;
    certificates: ComplianceCertificate[];
    saveCertification: (cert: ComplianceCertificate) => Promise<void>;
}
