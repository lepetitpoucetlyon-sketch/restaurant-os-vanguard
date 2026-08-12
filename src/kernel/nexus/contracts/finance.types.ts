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
    /** @deprecated use amountInMicrounits */
    amountInCents: number;
    amountInMicrounits?: number;
    date: string | Date;
    pieceNumber: string;
    /** @deprecated use debitInMicrounits */
    debitInCents: number;
    debitInMicrounits?: number;
    /** @deprecated use creditInMicrounits */
    creditInCents: number;
    creditInMicrounits?: number;
    /** @deprecated use runningBalanceInMicrounits */
    runningBalanceInCents: number;
    runningBalanceInMicrounits?: number;
}

export type JournalEntryStatus = 'draft' | 'validated' | 'closed' | 'pending' | 'cancelled' | 'refunded';

/**
 * JournalEntry — Type de STOCKAGE Firestore + affichage (couche domaine/UI)
 *
 * ⚠️  Ce type représente un enregistrement tel que stocké dans Firestore.
 *     Il n'est PAS le schéma de validation NF525.
 *
 * Pour la validation d'entrée (API, Bridge NF525), utiliser :
 *   import { JournalEntrySchema } from '@nexus/contracts'
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
    /** @deprecated use amountInMicrounits */
    amountInCents?: number;
    amountInMicrounits?: number;
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
    /** @deprecated use balanceInMicrounits */
    balanceInCents?: number;
    balanceInMicrounits?: number;
    updatedAt: number | string | Date;
}

export interface BankTransaction {
    id: string;
    date: number | string | Date;
    label: string;
    /** @deprecated use amountInMicrounits */
    amountInCents: number;
    amountInMicrounits?: number;
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
    /** @deprecated use amountInMicrounits */
    amountInCents: number;
    amountInMicrounits?: number;
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
    /** @deprecated use totalCashInMicrounits */
    totalCashInCents: number;
    totalCashInMicrounits?: number;
    /** @deprecated use totalPendingInMicrounits */
    totalPendingInCents: number;
    totalPendingInMicrounits?: number;
    /** @deprecated use totalOwedInMicrounits */
    totalOwedInCents: number;
    totalOwedInMicrounits?: number;
    /** @deprecated use forecastedCashFlowInMicrounits */
    forecastedCashFlowInCents: number;
    forecastedCashFlowInMicrounits?: number;
    /** @deprecated use burnRateInMicrounits */
    burnRateInCents: number;
    burnRateInMicrounits?: number;
    runwayInDays: number;
    [key: string]: unknown;
}

export interface FinancialMetrics {
    /** @deprecated use totalRevenueInMicrounits */
    totalRevenueInCents: number;
    totalRevenueInMicrounits?: number;
    /** @deprecated use totalExpensesInMicrounits */
    totalExpensesInCents: number;
    totalExpensesInMicrounits?: number;
    /** @deprecated use grossMarginInMicrounits */
    grossMarginInCents: number;
    grossMarginInMicrounits?: number;
    grossMarginPercent: number;
    foodCostPercent: number;
    laborCostPercent: number;
    /** @deprecated use operatingExpensesInMicrounits */
    operatingExpensesInCents: number;
    operatingExpensesInMicrounits?: number;
    /** @deprecated use ebitdaInMicrounits */
    ebitdaInCents: number;
    ebitdaInMicrounits?: number;
    /** @deprecated use netProfitInMicrounits */
    netProfitInCents: number;
    netProfitInMicrounits?: number;
    [key: string]: unknown;
}

export interface LedgerAccount extends Account {
    /** @deprecated use balanceInMicrounits */
    balanceInCents: number;
    balanceInMicrounits?: number;
    /** @deprecated use debitTotalInMicrounits */
    debitTotalInCents: number;
    debitTotalInMicrounits?: number;
    /** @deprecated use creditTotalInMicrounits */
    creditTotalInCents: number;
    creditTotalInMicrounits?: number;
    movements: JournalLine[];
}

export interface AccountingMetrics extends FinancialMetrics {
    /** @deprecated use cashOnHandInMicrounits */
    cashOnHandInCents: number;
    cashOnHandInMicrounits?: number;
    /** @deprecated use ebitdaInMicrounits */
    ebitdaInCents: number;
    ebitdaInMicrounits?: number;
    /** @deprecated use operatingExpensesInMicrounits */
    operatingExpensesInCents: number;
    operatingExpensesInMicrounits?: number;
}

export interface TrialBalance {
    periodId: string;
    accounts: {
        accountId: string;
        accountCode: string;
        accountName: string;
        /** @deprecated use debitInMicrounits */
        debitInCents: number;
        debitInMicrounits?: number;
        /** @deprecated use creditInMicrounits */
        creditInCents: number;
        creditInMicrounits?: number;
    }[];
    /** @deprecated use totalDebitInMicrounits */
    totalDebitInCents: number;
    totalDebitInMicrounits?: number;
    /** @deprecated use totalCreditInMicrounits */
    totalCreditInCents: number;
    totalCreditInMicrounits?: number;
    isBalanced: boolean;
}

export interface ProfitAndLossReport {
    periodId: string;
    periodName: string;
    revenues: { category: string; accountCode?: string; accountName?: string; /** @deprecated use amountInMicrounits */ amountInCents: number; amountInMicrounits?: number }[];
    expenses: { category: string; accountCode?: string; accountName?: string; /** @deprecated use amountInMicrounits */ amountInCents: number; amountInMicrounits?: number }[];
    /** @deprecated use totalRevenueInMicrounits */
    totalRevenueInCents: number;
    totalRevenueInMicrounits?: number;
    /** @deprecated use totalExpensesInMicrounits */
    totalExpensesInCents: number;
    totalExpensesInMicrounits?: number;
    /** @deprecated use netResultInMicrounits */
    netResultInCents: number;
    netResultInMicrounits?: number;
    generatedAt: Date | string;
}

export interface BalanceSheetReport {
    asOfDate: Date | string;
    assets: { category: string; accountCode?: string; accountName?: string; /** @deprecated use amountInMicrounits */ amountInCents: number; amountInMicrounits?: number }[];
    liabilities: { category: string; accountCode?: string; accountName?: string; /** @deprecated use amountInMicrounits */ amountInCents: number; amountInMicrounits?: number }[];
    equity: { category: string; accountCode?: string; accountName?: string; /** @deprecated use amountInMicrounits */ amountInCents: number; amountInMicrounits?: number }[];
    /** @deprecated use totalAssetsInMicrounits */
    totalAssetsInCents: number;
    totalAssetsInMicrounits?: number;
    /** @deprecated use totalLiabilitiesInMicrounits */
    totalLiabilitiesInCents: number;
    totalLiabilitiesInMicrounits?: number;
    /** @deprecated use totalEquityInMicrounits */
    totalEquityInCents: number;
    totalEquityInMicrounits?: number;
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
    /** @deprecated use foodCostInMicrounits */
    foodCostInCents: number;
    foodCostInMicrounits?: number;
    /** @deprecated use laborCostInMicrounits */
    laborCostInCents: number;
    laborCostInMicrounits?: number;
    /** @deprecated use opExInMicrounits */
    opExInCents: number;
    opExInMicrounits?: number;
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
    /** @deprecated use subTotalInMicrounits */
    subTotalInCents: number;
    subTotalInMicrounits?: number;
    /** @deprecated use taxTotalInMicrounits */
    taxTotalInCents: number;
    taxTotalInMicrounits?: number;
    /** @deprecated use totalInMicrounits */
    totalInCents: number;
    totalInMicrounits?: number;
    taxDetails: Array<{
        rate: number;
        /** @deprecated use amountInMicrounits */
        amountInCents: number;
        amountInMicrounits?: number;
        /** @deprecated use baseInMicrounits */
        baseInCents: number;
        baseInMicrounits?: number;
    }>;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    issuedAt: string;
    seal?: string;
}
