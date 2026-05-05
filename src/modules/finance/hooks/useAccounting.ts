"use client";

import { useAtom, useAtomValue } from 'jotai';
import { 
    journalEntriesNodeAtom, 
    accountsAtom, 
    bankTransactionsAtom, 
    expenseClaimsAtom,
    accountingViewModeAtom
} from '../store/accountingAtoms';
import { fiscalLedgerAtom } from '@/store/pillars/compliance';
import { 
    AccountingMetrics, 
    FinancialMetrics,
    JournalEntry,
    BankTransaction,
    ExpenseClaim,
    Account
} from '../types';
import { useCallback, useMemo } from 'react';
import { useNexusMutation } from "@shared/hooks/useNexusMutation";

/**
 * 📊 useAccounting - Grade X Atomic Mapper
 * Orchestre la finance souveraine et la conformité NF525.
 */
export function useAccounting() {
    const [viewMode, setViewMode] = useAtom(accountingViewModeAtom);
    const journalEntriesNode = useAtomValue(journalEntriesNodeAtom);
    const journalEntries = (journalEntriesNode.data || []) as unknown as JournalEntry[];
    const isLoading = journalEntriesNode.loading;
    const accounts = useAtomValue(accountsAtom);
    const bankTransactions = (useAtomValue(bankTransactionsAtom) || []) as unknown as BankTransaction[];
    const expenseClaims = (useAtomValue(expenseClaimsAtom) || []) as unknown as ExpenseClaim[];
    const ledgerData = useAtomValue(fiscalLedgerAtom);

    // --- 🔨 LA FORGE ---
    const accountingForge = useNexusMutation<JournalEntry>(journalEntriesNodeAtom as any, 'journalEntries', 'ACCOUNTING');

    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'simple' ? 'expert' : 'simple');
    }, [setViewMode]);

    // Computed Metrics (Grade X logic)
    const metrics = useMemo<FinancialMetrics>(() => {
        const revenue = journalEntries.reduce((sum, tx) => sum + (tx.type === 'revenue' ? Number(tx.amountInMicrounits) : 0), 0);
        const expenses = journalEntries.reduce((sum, tx) => sum + (tx.type === 'expense' ? Number(tx.amountInMicrounits) : 0), 0);
        const netProfit = revenue - expenses;
        
        return {
            totalRevenue: revenue,
            totalExpenses: expenses,
            netProfit: netProfit,
            margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
            period: 'current'
        } as FinancialMetrics;
    }, [journalEntries]);

    const accountingMetrics = useMemo<AccountingMetrics>(() => ({
        unreconciledCount: bankTransactions.filter(tx => !tx.journalEntryId).length,
        pendingClaimsCount: expenseClaims.filter(c => c.status === 'pending').length,
        lastClosureDate: null,
        fiscalHealthScore: 100
    }), [bankTransactions, expenseClaims]);

    return {
        // State
        viewMode,
        journalEntries: journalEntries as JournalEntry[],
        accounts: accounts as Account[],
        bankTransactions: bankTransactions as BankTransaction[],
        expenseClaims: expenseClaims as ExpenseClaim[],
        metrics,
        accountingMetrics,
        isLoading,
        ledgerData,
        
        // Actions
        toggleViewMode,
        addJournalEntry: async (entry: JournalEntry) => {
            const id = entry.id || `tx_${Date.now()}`;
            return accountingForge.mutate('SET', id, entry);
        },
        // Bridge functions required by page
        validateJournalEntry: async (id: string) => {
            return accountingForge.mutate('UPDATE', id, { status: 'validated' });
        }
    };
}
