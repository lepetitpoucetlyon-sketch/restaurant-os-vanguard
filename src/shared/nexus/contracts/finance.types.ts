import { SovereignMap, SovereignNode } from '@/shared/nexus-contract';

export type TransactionCategory = 
  | 'revenue' | 'expense' | 'purchases' | 'fixed' | 'payroll' | 'bank' | 'tax' | 'other' | 'loss' | 'sales';

export type AccountSide = 'debit' | 'credit';

export interface FiscalSeal extends SovereignMap {
    id?: string;
    hash: string;
    previousHash: string;
    sequence?: number;
    signedPayload?: string;
    signature?: string; 
    algorithm?: string;
    timestamp?: string;
    dataSnapshot?: string;
    transactionId?: string;
    updatedAt: string;
}

export interface JournalLine extends SovereignMap {
    accountId: string;
    accountCode: string;
    accountName: string;
    description: string;
    side: AccountSide;
    amountInCents: number;
    date: string | Date;
    pieceNumber: string;
    debitInCents: number;
    creditInCents: number;
    runningBalanceInCents: number;
}

export type JournalEntryStatus = 'draft' | 'validated' | 'closed' | 'pending' | 'cancelled' | 'refunded';

/**
 * JournalEntry — Type de STOCKAGE Firestore + affichage (couche domaine/UI)
 *
 * ⚠️  Ce type représente un enregistrement tel que stocké dans Firestore.
 *     Il n'est PAS le schéma de validation NF525.
 *
 * Pour la validation d'entrée (API, Bridge NF525), utiliser :
 *   import { JournalEntrySchema } from '@/domain/schemas/finance'
 *
 * Pour lire/afficher des enregistrements Firestore, utiliser ce type.
 */
export interface JournalEntry extends SovereignNode {
    id: string;
    date: number | string | Date;
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
    status?: JournalEntryStatus;
    updatedAt: number | string | Date;
    cancellationRef?: string;
}

export interface Account extends SovereignMap {
    id: string;
    code: string;          
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    class: '1' | '2' | '3' | '4' | '5' | '6' | '7';
    parentCode?: string;   
    isActive: boolean;
    description?: string;
    balanceInCents?: number;
    updatedAt: number | string | Date;
}

export interface BankTransaction {
    id: string;
    date: number | string | Date;
    label: string;
    amountInCents: number;
    amount?: number; 
    type: 'credit' | 'debit';
    isReconciled: boolean;
    reconciledWith?: string; 
    reconciledAt?: Date | string | number;
    signature?: string;    
    updatedAt: number | string | Date;
}

export interface BankConnection {
    id: string;
    provider: 'powens' | 'tink' | 'plaid' | 'bridge' | 'manual';
    institutionName: string;
    status: 'active' | 'error' | 'disconnected';
    lastSyncAt: Date | string;
}

export interface ExpenseClaim {
    id: string;
    userId: string;
    userName: string;
    userRole: string; 
    date: number | string | Date;
    amountInCents: number;
    category: string;
    description: string;
    invoiceId?: string;
    receiptUrl?: string; 
    receiptImage?: string; 
    status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
    approvedBy?: string;
    approvedAt?: string | Date;
    processedAt?: string | Date | number;
    journalEntryId?: string;
    updatedAt: number | string | Date;
}

export interface TreasuryMetrics {
    totalCashInCents: number;
    totalPendingInCents: number;
    totalOwedInCents: number;
    forecastedCashFlowInCents: number;
    burnRateInCents: number;
    runwayInDays: number;
    [key: string]: unknown;
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
    [key: string]: unknown;
}

export interface LedgerAccount extends Account {
    balanceInCents: number;
    debitTotalInCents: number;
    creditTotalInCents: number;
    movements: JournalLine[];
}

export interface AccountingMetrics extends FinancialMetrics {
    cashOnHandInCents: number;
    ebitdaInCents: number;
    operatingExpensesInCents: number;
}

export interface TrialBalance {
    periodId: string;
    accounts: {
        accountId: string;
        accountCode: string;
        accountName: string;
        debitInCents: number;
        creditInCents: number;
    }[];
    totalDebitInCents: number;
    totalCreditInCents: number;
    isBalanced: boolean;
}

export interface ProfitAndLossReport {
    periodId: string;
    periodName: string;
    revenues: { category: string; accountCode?: string; accountName?: string; amountInCents: number }[];
    expenses: { category: string; accountCode?: string; accountName?: string; amountInCents: number }[];
    totalRevenueInCents: number;
    totalExpensesInCents: number;
    netResultInCents: number;
    generatedAt: Date | string;
}

export interface BalanceSheetReport {
    asOfDate: Date | string;
    assets: { category: string; accountCode?: string; accountName?: string; amountInCents: number }[];
    liabilities: { category: string; accountCode?: string; accountName?: string; amountInCents: number }[];
    equity: { category: string; accountCode?: string; accountName?: string; amountInCents: number }[];
    totalAssetsInCents: number;
    totalLiabilitiesInCents: number;
    totalEquityInCents: number;
    isBalanced: boolean;
    generatedAt: Date | string;
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
    type: 'NF525' | 'GDPR' | 'HACCP';
    issuedAt: Date | string;
    expiresAt: Date | string;
    status: 'valid' | 'expired' | 'revoked';
    hash: string;
}

export interface FiscalPeriod {
    id: string;
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    status: 'open' | 'closed' | 'archived';
    isTaxReported: boolean;
}

export interface CalculatedFinancialMetrics extends FinancialMetrics {
    foodCostInCents: number;
    laborCostInCents: number;
    opExInCents: number;
}

export interface AccountingContextType {
    accounts: Account[];
    ledger: LedgerAccount[];
    journalEntries: JournalEntry[];
    bankTransactions: BankTransaction[];
    bankConnections: BankConnection[];
    expenseClaims: ExpenseClaim[];
    fiscalPeriods: FiscalPeriod[];
    metrics: AccountingMetrics;
    legacyMetrics: CalculatedFinancialMetrics;
    isSyncing: boolean;
    isLoading: boolean;
    viewMode: 'simple' | 'expert';
    toggleViewMode: () => void;
    generatePandL: (periodId: string) => ProfitAndLossReport;
    generateBalanceSheet: (date: Date) => BalanceSheetReport;
    generateTrialBalance: (periodId: string) => TrialBalance;
    validateJournalEntry: (id: string) => Promise<void>;
    reconcileTransaction: (bankTxId: string, entryId: string) => Promise<void>;
    addJournalEntry: (entry: JournalEntry) => Promise<void>;
    addManualJournalEntry: (entry: JournalEntry) => Promise<void>;
    updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
    // NF525 : pas de deleteJournalEntry — le ledger fiscal est immuable (jamais delete).
    addAccount: (account: Account) => Promise<void>;
    updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
    submitExpenseClaim: (claim: ExpenseClaim, receiptBlob?: string) => Promise<void>;
    approveExpenseClaim: (id: string) => Promise<void>;
    rejectExpenseClaim: (id: string) => Promise<void>;
    linkBankConnection: (connectionData: Partial<BankConnection>) => Promise<void>;
    syncBankConnection: (id: string) => Promise<void>;
    disconnectBank: (id: string) => Promise<void>;
    recordPayrollSalary: (userId: string, netAmount: number, socialCharges: number, month: string) => Promise<void>;
    submitExpense: (claim: Partial<ExpenseClaim>) => Promise<void>;
    ingestTransactions: (transactions: BankTransaction[]) => Promise<void>;
    getLedger: (accountId: string) => LedgerAccount | null;
    getLedgerForAccount: (id: string) => JournalLine[];
    getAccountByCode: (code: string) => Account | undefined;
    getMetrics: () => AccountingMetrics;
    getCalculatedFinancialMetrics: () => CalculatedFinancialMetrics;
    generateAnnualFEC: (year: number, siren?: string) => Promise<void>;
    runFiscalAudit: () => Promise<FiscalAuditResult>;
    saveCertification: (cert: ComplianceCertificate) => Promise<void>;
    certificates: ComplianceCertificate[];
    expert: {
        queryExpert: (prompt: string) => Promise<{ response: string; confidence: number }>;
        isConfigured: boolean;
        isAuthorized: boolean;
        role: string;
        modelId: string;
    };
    agent: {
        query: (prompt: string) => Promise<{ status: string }>;
        isProcessing: boolean;
    };
}

export interface LegalInvoice extends SovereignNode {
    orderId: string;
    invoiceNumber: string;
    customerName?: string;
    subTotalInCents: number;
    taxTotalInCents: number;
    totalInCents: number;
    taxDetails: Array<{
        rate: number;
        amountInCents: number;
        baseInCents: number;
    }>;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    issuedAt: string;
    seal?: string;
}
