"use client";

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { 
    accountsAtom, 
    journalEntriesAtom, 
    bankTransactionsAtom,
    expenseClaimsAtom,
    accountingLoadingAtom
} from '@/modules/finance/store/accountingAtoms';
import { 
    AccountingContextType, 
    LedgerAccount, 
    JournalEntry, 
    Account, 
    ExpenseClaim, 
    BankConnection, 
    BankTransaction,
    ComplianceCertificate,
    AccountingMetrics,
    FinanceFinancialMetrics as FinancialMetrics, // Conflict with common metrics maybe?
    ProfitAndLossReport,
    BalanceSheetReport,
    TrialBalance,
    FiscalAuditResult
} from '@/types';

// Alias FinancialMetrics to avoid confusion if needed
type FinancialMetricsTyped = FinancialMetrics; 

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const accounts = useAtomValue(accountsAtom) as Account[];
    const journalEntries = useAtomValue(journalEntriesAtom) as JournalEntry[];
    const bankTransactions = useAtomValue(bankTransactionsAtom) as BankTransaction[];
    const expenseClaims = useAtomValue(expenseClaimsAtom) as ExpenseClaim[];
    const isLoading = useAtomValue(accountingLoadingAtom);

    // Mock/Compute Ledger for UI
    const ledger = useMemo<LedgerAccount[]>(() => {
        return (accounts || []).map(acc => ({
            ...acc,
            balanceInCents: 0,
            debitTotalInCents: 0,
            creditTotalInCents: 0,
            movements: []
        }));
    }, [accounts]);

    const metrics = useMemo<AccountingMetrics>(() => ({
        totalRevenueInCents: 0,
        totalExpensesInCents: 0,
        grossMarginInCents: 0,
        grossMarginPercent: 0,
        foodCostPercent: 0,
        laborCostPercent: 0,
        operatingExpensesInCents: 0,
        ebitdaInCents: 0,
        netProfitInCents: 0
    }), []);

    const generatePandL = useCallback((periodId: string): ProfitAndLossReport => ({
        periodId,
        periodName: periodId === 'current' ? 'Période Actuelle' : periodId,
        revenues: [],
        expenses: [],
        totalRevenueInCents: 0,
        totalExpensesInCents: 0,
        netResultInCents: 0,
        generatedAt: new Date()
    }), []);

    const validateJournalEntry = useCallback(async (id: string) => {
        console.log("Stub Validate Entry", id);
    }, []);

    const reconcileTransaction = useCallback(async (bankTxId: string, entryId: string) => {
        console.log("Stub Reconcile", { bankTxId, entryId });
    }, []);

    const addJournalEntry = useCallback(async (entry: JournalEntry) => {
        console.log("Stub Add Entry", entry);
    }, []);

    const addManualJournalEntry = useCallback(async (entry: JournalEntry) => {
        console.log("Stub Add Manual Entry", entry);
    }, []);

    const updateJournalEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
        console.log("Stub Update Entry", id, updates);
    }, []);

    const deleteJournalEntry = useCallback(async (id: string) => {
        console.log("Stub Delete Entry", id);
    }, []);

    const addAccount = useCallback(async (account: Account) => {
        console.log("Stub Add Account", account);
    }, []);

    // Dead contextValue stub removed
    const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
        console.log("Stub Update Account", id, updates);
    }, []);

    const submitExpenseClaim = useCallback(async (claim: Omit<ExpenseClaim, 'id' | 'userId' | 'userName' | 'status' | 'date' | 'userRole'>, receiptBlob?: string) => {
        console.log("Stub Submit Expense Claim", claim, receiptBlob);
    }, []);

    const approveExpenseClaim = useCallback(async (id: string) => {
        console.log("Stub Approve Expense Claim", id);
    }, []);

    const rejectExpenseClaim = useCallback(async (id: string) => {
        console.log("Stub Reject Expense Claim", id);
    }, []);

    const linkBankConnection = useCallback(async (connectionData: Partial<BankConnection>) => {
        console.log("Stub Link Bank Connection", connectionData);
    }, []);

    const recordPayrollSalary = useCallback(async (userId: string, netAmount: number, socialCharges: number, month: string) => {
        console.log("Stub Payroll", { userId, netAmount, socialCharges, month });
    }, []);

    const submitExpense = useCallback(async (claim: Partial<ExpenseClaim>) => {
        console.log("Stub Submit Expense", claim);
    }, []);

    const ingestTransactions = useCallback(async (transactions: BankTransaction[]) => {
        console.log("Stub Ingest Transactions", transactions);
    }, []);

    const generateBalanceSheet = useCallback((date: Date): BalanceSheetReport => ({
        asOfDate: date,
        assets: [],
        liabilities: [],
        equity: [],
        totalAssetsInCents: 0,
        totalLiabilitiesInCents: 0,
        totalEquityInCents: 0,
        isBalanced: true,
        generatedAt: new Date()
    }), []);

    const generateTrialBalance = useCallback((periodId: string): TrialBalance => ({
        periodId,
        accounts: [],
        totalDebitInCents: 0,
        totalCreditInCents: 0,
        isBalanced: true
    }), []);

    const getLedger = useCallback((accountId: string) => ledger.find(acc => acc.id === accountId) || null, [ledger]);
    const getLedgerForAccount = useCallback((id: string) => ledger.find(acc => acc.id === id)?.movements || [], [ledger]);
    const getAccountByCode = useCallback((code: string) => accounts.find(acc => acc.code === code), [accounts]);
    const getMetrics = useCallback(() => metrics, [metrics]);
    
    const getCalculatedFinancialMetrics = useCallback(() => ({
        totalRevenueInCents: 0,
        totalExpensesInCents: 0,
        grossMarginInCents: 0,
        foodCostInCents: 0,
        laborCostInCents: 0,
        opExInCents: 0,
        ebitdaInCents: 0,
        netProfitInCents: 0,
        cashOnHandInCents: 0,
        grossMarginPercent: 0,
        foodCostPercent: 0,
        laborCostPercent: 0,
        operatingExpensesInCents: 0
    }), []);

    const generateAnnualFEC = useCallback(async (year: number, siren?: string) => {
        console.log("Stub FEC", { year, siren });
    }, []);

    const runFiscalAudit = useCallback(async (): Promise<FiscalAuditResult> => ({
        isValid: true,
        errors: [],
        warnings: [],
        periodCovered: { start: new Date(), end: new Date() },
        integrityHash: "stub_hash"
    }), []);

    const saveCertification = useCallback(async (cert: ComplianceCertificate) => {
        console.log("Stub Cert", cert);
    }, []);

    const value: AccountingContextType = {
        accounts,
        ledger,
        journalEntries,
        bankTransactions,
        expenseClaims,
        bankConnections: [],
        fiscalPeriods: [],
        metrics,
        legacyMetrics: getCalculatedFinancialMetrics(),
        isLoading,
        viewMode: 'simple',
        toggleViewMode: () => {},
        generatePandL,
        generateBalanceSheet,
        generateTrialBalance,
        validateJournalEntry,
        reconcileTransaction,
        addJournalEntry,
        addManualJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        addAccount,
        updateAccount,
        submitExpenseClaim,
        approveExpenseClaim,
        rejectExpenseClaim,
        linkBankConnection,
        recordPayrollSalary,
        submitExpense,
        ingestTransactions,
        getLedger,
        getLedgerForAccount,
        getAccountByCode,
        getMetrics,
        getCalculatedFinancialMetrics,
        generateAnnualFEC,
        runFiscalAudit,
        saveCertification,
        certificates: [],
        expert: {
            queryExpert: async () => ({ response: 'STUB', confidence: 100 }),
            isConfigured: true,
            isAuthorized: true,
            role: 'accounting_expert',
            modelId: 'gemini-1.5-pro'
        },
        agent: {
            query: async () => ({ status: 'STUB' }),
            isProcessing: false
        }
    };

    return (
        <AccountingContext.Provider value={value}>
            {children}
        </AccountingContext.Provider>
    );
};

export const useAccounting = () => {
    const context = useContext(AccountingContext);
    if (!context) {
        throw new Error("useAccounting must be used within an AccountingProvider");
    }
    return context;
};
