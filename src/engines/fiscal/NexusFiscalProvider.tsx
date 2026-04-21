"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useAuth, useTenant } from '@/engines/core/NexusCoreProvider';
import { FiscalEngine } from '@/domain/services/FiscalEngine';
import { NF525Service } from '@/domain/services/NF525Service';
import { ZodInterceptor } from '@/domain/services/ZodInterceptor';
import { ExpenseClaimSchema } from '@/domain/schemas/accounting';
import { submitExpenseAction } from '@/app/(admin)/actions/accounting';
import { 
    JournalEntry, 
    Account, 
    BankTransaction, 
    ExpenseClaim, 
    TreasuryMetrics,
    FiscalSeal,
    FiscalAuditResult
} from '@/modules/finance/types';
import { SensorReading, HygieneLog } from '@/modules/haccp/types';

import { useAtomValue } from 'jotai';
import { 
    fiscalLedgerAtom, 
    fiscalLoadingAtom,
    accountsAtom,
    bankTransactionsAtom,
    expenseClaimsAtom,
    isAccountingSyncingAtom
} from '@/store/operationalAtoms';

interface NexusFiscalState {
    accounting: {
        entries: JournalEntry[];
        journalEntries: JournalEntry[];
        isLoading: boolean;
        metrics: {
            totalRevenueInCents: number;
            totalExpensesInCents: number;
            netProfitInCents: number;
        };
        legacyMetrics: {
            cashOnHandInCents: number;
        };
        submitExpense: (claim: Omit<ExpenseClaim, 'id' | 'status' | 'date' | 'userName' | 'userRole'>) => Promise<string>;
        recordPayrollSalary: (userId: string, net: number, charges: number, month: string) => Promise<void>;
        syncBankAccounts: (token: string) => Promise<BankTransaction[]>;
        accounts: Account[];
        bankTransactions: BankTransaction[];
        expenseClaims: ExpenseClaim[];
        isSyncing: boolean;
    };
    compliance: {
        seals: string[];
        runAudit: () => Promise<FiscalAuditResult>;
        getComplianceScore: () => number;
        checklists: HygieneLog[];
        sensors: SensorReading[];
        temperatureHistory: SensorReading[];
    };
    finance: {
        treasury: TreasuryMetrics;
        alerts: { id: string; level: 'info' | 'warning' | 'critical'; message: string }[];
        bankTransactions: BankTransaction[];
    };
    audit: { runAudit: () => Promise<FiscalAuditResult> };
    registre: {
        sales: JournalEntry[];
        dailyReports: { date: string; totalInCents: number; status: string }[];
        isCertified: boolean;
    };
}

const NexusFiscalContext = createContext<NexusFiscalState | undefined>(undefined);

export const NexusFiscalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const { activeTenantId } = useTenant();
    
    // 1. ATOMIC SYNC SUBSCRIPTION
    const ledgerEntries = useAtomValue(fiscalLedgerAtom);
    const isLoading = useAtomValue(fiscalLoadingAtom);
    const accounts = useAtomValue(accountsAtom);
    const bankTransactions = useAtomValue(bankTransactionsAtom);
    const expenseClaims = useAtomValue(expenseClaimsAtom);
    const isSyncing = useAtomValue(isAccountingSyncingAtom);
    
    // 2. COMPLIANCE & NF525
    const fiscalSeals = useMemo(() => 
        ledgerEntries.filter((e: JournalEntry) => e.fiscalSealHash).map((e: JournalEntry) => e.fiscalSealHash as string),
    [ledgerEntries]);

    // 3. FINANCIAL STATE (Grade X Mock/Sync)
    const financialMetrics = useMemo(() => {
        const revenue = ledgerEntries.filter(e => e.type === 'revenue').reduce((acc, e) => acc + (e.amountInCents || e.amount || 0), 0);
        const expenses = ledgerEntries.filter(e => e.type === 'expense').reduce((acc, e) => acc + (e.amountInCents || e.amount || 0), 0);
        return {
            totalRevenueInCents: revenue,
            totalExpensesInCents: expenses,
            netProfitInCents: revenue - expenses
        };
    }, [ledgerEntries]);

    const treasury = useMemo(() => ({
        cashOnHand: financialMetrics.netProfitInCents,
        bankBalance: financialMetrics.netProfitInCents * 0.8,
        pendingReceivables: 1250000, 
        pendingPayables: 450000,    
        forecast30Days: financialMetrics.netProfitInCents * 1.2,
        netCashPosition: financialMetrics.netProfitInCents,
        cashFlowTrend: [],
        forecast30DaysValue: financialMetrics.netProfitInCents * 1.2
    }), [financialMetrics]);


    const submitExpense = useCallback(async (expenseData: Omit<ExpenseClaim, 'id' | 'status' | 'date' | 'userName' | 'userRole'>) => {
        if (!activeTenantId || !currentUser) {
            throw new Error("Cannot submit expense: No active tenant ID or User session.");
        }
        
        try {
            const result = await submitExpenseAction(activeTenantId, {
                ...expenseData,
                userId: currentUser.uid || currentUser.id,
                userName: currentUser.displayName || currentUser.name || 'System User'
            });
            return result.id;
        } catch (error) {
            console.error('NexusFiscal: Failed to submit expense:', error);
            throw error;
        }
    }, [activeTenantId, currentUser]);

    const syncBankAccounts = useCallback(async (token: string) => {
        const { PowensService } = await import('@/domain/accounting/PowensService');
        return PowensService.getAccounts(token);
    }, []);
    
    const runFiscalAudit = useCallback(async () => {
        return await FiscalEngine.runAudit(fiscalSeals, 'default_instance');
    }, [fiscalSeals]);

    const recordPayrollSalary = useCallback(async (userId: string, net: number, charges: number, month: string) => {
        if (!activeTenantId) return;
        return submitExpense({
            label: `Salaire [User:${userId}] - ${month}`,
            amount: net + charges,
            type: 'expense',
            category: 'staff',
            date: new Date()
        });
    }, [activeTenantId, submitExpense]);

    const contextValue: NexusFiscalState = useMemo(() => ({
        accounting: { 
            entries: ledgerEntries,
            journalEntries: ledgerEntries,
            accounts,
            bankTransactions,
            expenseClaims,
            isLoading,
            isSyncing,
            metrics: financialMetrics,
            legacyMetrics: {
                cashOnHandInCents: financialMetrics.netProfitInCents
            },
            submitExpense,
            recordPayrollSalary,
            syncBankAccounts
        },
        compliance: { 
            seals: fiscalSeals, 
            runAudit: runFiscalAudit,
            getComplianceScore: () => 98,
            checklists: [],
            sensors: [],
            temperatureHistory: []
        },
        finance: {
            treasury,
            alerts: [],
            bankTransactions
        },
        audit: { runAudit: runFiscalAudit },
        registre: {
            sales: [],
            dailyReports: [],
            isCertified: true
        }
    }), [ledgerEntries, accounts, bankTransactions, expenseClaims, isLoading, isSyncing, financialMetrics, treasury, fiscalSeals, runFiscalAudit, submitExpense, syncBankAccounts]);


    return (
        <NexusFiscalContext.Provider value={contextValue}>
            {children}
        </NexusFiscalContext.Provider>
    );
};

export const useNexusFiscal = () => {
    const context = useContext(NexusFiscalContext);
    if (!context) throw new Error('useNexusFiscal must be used within a NexusFiscalProvider');
    return context;
};

export const useAccounting = () => {
    const context = useNexusFiscal();
    return context.accounting;
};

export const useCompliance = () => {
    const context = useNexusFiscal();
    return context.compliance;
};

export const useFinance = () => {
    const context = useNexusFiscal();
    return context.finance;
};

