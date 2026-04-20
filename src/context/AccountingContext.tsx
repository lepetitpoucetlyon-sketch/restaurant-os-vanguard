"use client";

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { 
    accountsAtom, 
    journalEntriesAtom, 
    bankTransactionsAtom,
    expenseClaimsAtom,
    accountingLoadingAtom
} from '@/store/accountingAtoms';
import { AccountingContextType, LedgerAccount } from '@/types/accounting.types';

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const accounts = useAtomValue(accountsAtom);
    const journalEntries = useAtomValue(journalEntriesAtom);
    const bankTransactions = useAtomValue(bankTransactionsAtom);
    const expenseClaims = useAtomValue(expenseClaimsAtom);
    const isLoading = useAtomValue(accountingLoadingAtom);

    // Mock/Compute Ledger for UI
    const ledger = useMemo<LedgerAccount[]>(() => {
        return accounts.map(acc => ({
            ...acc,
            balanceInCents: 0,
            debitTotalInCents: 0,
            creditTotalInCents: 0,
            movements: []
        }));
    }, [accounts]);

    const metrics = useMemo(() => ({
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

    const generatePandL = useCallback((periodId: string) => ({
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

    (reconcileTransaction as any).ingestTransactions = async (txs: any[]) => {
        console.log("Stub Ingest", txs);
    };

    const value: AccountingContextType = {
        accounts,
        ledger,
        journalEntries,
        bankTransactions,
        expenseClaims,
        fiscalPeriods: [],
        metrics,
        isLoading,
        viewMode: 'simple',
        toggleViewMode: () => {},
        generatePandL,
        validateJournalEntry,
        reconcileTransaction,
        // ... stubs for missing actions
    } as any;

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
