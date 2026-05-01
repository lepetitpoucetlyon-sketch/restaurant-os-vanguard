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
    signature?: string; 
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
    date: string | Date;
    pieceNumber: string;
    debitInCents: number;
    creditInCents: number;
    runningBalanceInCents: number;
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

export interface Account {
    id: string;
    code: string;          
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    class: '1' | '2' | '3' | '4' | '5' | '6' | '7';
    parentCode?: string;   
    isActive: boolean;
    description?: string;
    balanceInCents?: number;
}

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

export interface BankConnection {
    id: string;
    provider: 'plaid' | 'bridge' | 'manual';
    institutionName: string;
    status: 'active' | 'error' | 'disconnected';
    lastSyncAt: Date | string;
}

export interface ExpenseClaim {
    id: string;
    userId: string;
    userName: string;
    userRole: string; 
    date: string;
    amountInCents: number;
    category: string;
    description: string;
    invoiceId?: string;
    receiptUrl?: string; 
    receiptImage?: string; 
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    journalEntryId?: string;
}

export interface TreasuryMetrics {
    totalCashInCents: number;
    totalPendingInCents: number;
    totalOwedInCents: number;
    forecastedCashFlowInCents: number;
    burnRateInCents: number;
    runwayInDays: number;
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

export interface AccountingContextType {
    accounts: Account[];
    ledger: LedgerAccount[];
    journalEntries: JournalEntry[];
    bankTransactions: BankTransaction[];
    bankConnections: BankConnection[];
    expenseClaims: ExpenseClaim[];
    fiscalPeriods: SovereignData[];
    isSyncing: boolean;
    legacyMetrics: SovereignData;
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
    deleteJournalEntry: (id: string) => Promise<void>;
    addAccount: (account: Account) => Promise<void>;
    updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
    submitExpenseClaim: (claim: SovereignData, receiptBlob?: string) => Promise<void>;
    approveExpenseClaim: (id: string) => Promise<void>;
    rejectExpenseClaim: (id: string) => Promise<void>;
    linkBankConnection: (connectionData: Partial<BankConnection>) => Promise<void>;
    recordPayrollSalary: (userId: string, netAmount: number, socialCharges: number, month: string) => Promise<void>;
    submitExpense: (claim: Partial<ExpenseClaim>) => Promise<void>;
    ingestTransactions: (transactions: BankTransaction[]) => Promise<void>;
    getLedger: (accountId: string) => LedgerAccount | null;
    getLedgerForAccount: (id: string) => JournalLine[];
    getAccountByCode: (code: string) => Account | undefined;
    getMetrics: () => AccountingMetrics;
    getCalculatedFinancialMetrics: () => any;
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
