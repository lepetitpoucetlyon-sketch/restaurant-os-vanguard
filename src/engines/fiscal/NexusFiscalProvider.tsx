// @ts-nocheck
// @ts-nocheck
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useAuth, useTenant } from '@/engines/core/NexusCoreProvider';
import { FiscalEngine } from '@/domain/services/FiscalEngine';
import { NF525Service } from '@/domain/services/NF525Service';
import { ZodInterceptor } from '@/domain/services/ZodInterceptor';
import { ExpenseClaimSchema } from '@/domain/schemas/accounting';
import { submitExpenseAction } from '@/app/actions/accounting';

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
        entries: any[];
        journalEntries: any[];
        isLoading: boolean;
        metrics: {
            totalRevenueInCents: number;
            totalExpensesInCents: number;
            netProfitInCents: number;
        };
        legacyMetrics: {
            cashOnHandInCents: number;
        };
        submitExpense: (claim: any) => Promise<void>;
        recordPayrollSalary: (userId: string, net: number, charges: number, month: string) => Promise<void>;
    };
    compliance: any;
    finance: {
        treasury: {
            cashOnHand: number;
            bankBalance: number;
            pendingReceivables: number;
            pendingPayables: number;
            forecast30Days: number;
            netCashPosition: number;
            cashFlowTrend: any[];
            forecast30DaysValue?: number; // compat
        };
        alerts: any[];
        bankTransactions: any[];
    };
    audit: any;
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
        ledgerEntries.filter((e: any) => e.fiscalSeal).map((e: any) => e.fiscalSeal),
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


    const submitExpense = useCallback(async (expenseData: any) => {
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

    const contextValue = useMemo(() => ({
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
        audit: { runFiscalAudit }
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

