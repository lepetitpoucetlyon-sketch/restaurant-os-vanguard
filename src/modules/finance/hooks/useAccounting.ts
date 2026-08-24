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
import type { ProfitAndLossReport, BalanceSheetReport, LedgerAccount } from '@nexus/contracts/finance.types';

function computeLedger(accounts: Account[], journalEntries: JournalEntry[]): LedgerAccount[] {
    return accounts.map(account => {
        const movements = journalEntries
            .flatMap(e => (e.lines || []).map(l => ({
                accountId: l.accountId ?? account.id ?? '',
                accountCode: l.accountCode ?? account.code ?? '',
                accountName: l.accountName ?? account.name ?? '',
                description: l.description ?? e.description ?? '',
                side: l.side ?? 'debit',
                amountInCents: l.amountInCents ?? 0,
                debitInCents: l.debitInCents ?? 0,
                creditInCents: l.creditInCents ?? 0,
                date: typeof l.date === 'number' ? new Date(l.date).toISOString() : (l.date ?? (typeof e.date === 'number' ? new Date(e.date).toISOString() : String(e.date ?? new Date().toISOString()))),
                pieceNumber: l.pieceNumber ?? e.pieceNumber ?? '',
            })))
            .filter(l => l.accountId === account.id || l.accountCode === account.code);
        let running = 0;
        const movementsWithBalance = movements.map(m => {
            running += (m.debitInCents || 0) - (m.creditInCents || 0);
            return {
                ...m,
                runningBalanceInCents: running,
                runningBalanceInMicrounits: running * 10_000,
                debitInMicrounits: (m.debitInCents || 0) * 10_000,
                creditInMicrounits: (m.creditInCents || 0) * 10_000,
                amountInMicrounits: (m.amountInCents || 0) * 10_000,
            };
        });
        const debitTotal = movements.reduce((s, m) => s + (m.debitInCents || 0), 0);
        const creditTotal = movements.reduce((s, m) => s + (m.creditInCents || 0), 0);
        const balance = account.balanceInCents ?? (debitTotal - creditTotal);
        return {
            ...account,
            balanceInCents: balance,
            balanceInMicrounits: balance * 10_000,
            debitTotalInCents: debitTotal,
            debitTotalInMicrounits: debitTotal * 10_000,
            creditTotalInCents: creditTotal,
            creditTotalInMicrounits: creditTotal * 10_000,
            movements: movementsWithBalance,
        };
    });
}

export function getAmountInMu(tx: { amountInMicrounits?: unknown; amountInCents?: unknown; credit?: unknown; debit?: unknown }): number {
    if (tx.amountInMicrounits !== undefined && tx.amountInMicrounits !== null) return Number(tx.amountInMicrounits);
    if (tx.amountInCents !== undefined && tx.amountInCents !== null) return Number(tx.amountInCents) * 10_000;
    if (tx.credit || tx.debit) return (Number(tx.credit || 0) + Number(tx.debit || 0)) * 10_000;
    return 0;
}

export function buildEntryAmountInCents(
    e: { amountInMicrounits?: number | null; lines: { side: string; amountInMicrounits?: number }[] },
    side: 'credit' | 'debit',
    toCents: (µ: number) => number,
): number {
    if (e.amountInMicrounits != null) return toCents(e.amountInMicrounits);
    return e.lines.reduce((s, l) => s + (l.side === side ? toCents(l.amountInMicrounits ?? 0) : 0), 0);
}

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
    const accountingForge = useNexusMutation<JournalEntry>(journalEntriesNodeAtom, 'journalEntries', 'ACCOUNTING');

    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'simple' ? 'expert' : 'simple');
    }, [setViewMode]);

    // Computed Metrics (Grade X logic)
    const metrics = useMemo<FinancialMetrics>(() => {
        const revenue = journalEntries.reduce((sum, tx) => sum + (tx.type === 'revenue' || (tx.type as string) === 'DEBIT' ? getAmountInMu(tx) : 0), 0);
        const expenses = journalEntries.reduce((sum, tx) => sum + (tx.type === 'expense' || (tx.type as string) === 'CREDIT' ? getAmountInMu(tx) : 0), 0);
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

    // Ledger: account + mouvements calculés depuis les écritures
    const ledger = useMemo<LedgerAccount[]>(() => {
        return computeLedger(accounts as Account[], journalEntries);
    }, [accounts, journalEntries]);

    const generatePandL = useCallback((periodId: string = 'current'): ProfitAndLossReport => {
        // Note: JournalEntry.amountInMicrounits (1 cent = 10_000 µunits) is the source of truth.
        // The hook still exposes xxxInCents fields for the accounting views; convert as we read.
        const toCents = (µ: number) => Math.round(µ / 10_000);
        const revenues = journalEntries
            .filter(e => e.type === 'revenue')
            .map(e => {
                const c = buildEntryAmountInCents(e, 'credit', toCents);
                return { category: e.type ?? 'revenue', accountCode: e.pieceNumber, accountName: e.description, amountInCents: c, amountInMicrounits: c * 10_000 };
            });
        const expenses = journalEntries
            .filter(e => e.type === 'expense')
            .map(e => {
                const c = buildEntryAmountInCents(e, 'debit', toCents);
                return { category: e.type ?? 'expense', accountCode: e.pieceNumber, accountName: e.description, amountInCents: c, amountInMicrounits: c * 10_000 };
            });
        const totalRevenueInCents = revenues.reduce((s, r) => s + r.amountInCents, 0);
        const totalExpensesInCents = expenses.reduce((s, e) => s + e.amountInCents, 0);
        const netResultInCents = totalRevenueInCents - totalExpensesInCents;
        return {
            periodId,
            periodName: 'Période courante',
            revenues,
            expenses,
            totalRevenueInCents,
            totalRevenueInMicrounits: totalRevenueInCents * 10_000,
            totalExpensesInCents,
            totalExpensesInMicrounits: totalExpensesInCents * 10_000,
            netResultInCents,
            netResultInMicrounits: netResultInCents * 10_000,
            generatedAt: new Date().toISOString(),
        };
    }, [journalEntries]);

    const generateBalanceSheet = useCallback((_asOfDate: Date = new Date()): BalanceSheetReport => {
        const toLine = (type: string, label: string) =>
            (accounts as Account[])
                .filter(a => a.type === type)
                .map(a => {
                    const c = a.balanceInCents ?? 0;
                    return { category: label, accountCode: a.code, accountName: a.name, amountInCents: c, amountInMicrounits: c * 10_000 };
                });
        const assets = toLine('asset', 'Actif');
        const liabilities = toLine('liability', 'Passif');
        const equity = toLine('equity', 'Capitaux propres');
        const totalAssetsInCents = assets.reduce((s, a) => s + a.amountInCents, 0);
        const totalLiabilitiesInCents = liabilities.reduce((s, l) => s + l.amountInCents, 0);
        const totalEquityInCents = equity.reduce((s, e) => s + e.amountInCents, 0);
        return {
            asOfDate: new Date().toISOString(),
            assets,
            liabilities,
            equity,
            totalAssetsInCents,
            totalAssetsInMicrounits: totalAssetsInCents * 10_000,
            totalLiabilitiesInCents,
            totalLiabilitiesInMicrounits: totalLiabilitiesInCents * 10_000,
            totalEquityInCents,
            totalEquityInMicrounits: totalEquityInCents * 10_000,
            isBalanced: Math.abs(totalAssetsInCents - (totalLiabilitiesInCents + totalEquityInCents)) < 1,
            generatedAt: new Date().toISOString(),
        };
    }, [accounts]);

    const metricsWithCents = useMemo(() => {
        const netProfitMu    = Math.round(metrics.netProfit);
        const totalRevMu     = Math.round(metrics.totalRevenue);
        const totalExpMu     = Math.round(metrics.totalExpenses);
        return {
            ...metrics,
            netProfitInCents:       Math.round(netProfitMu  / 10_000),
            totalRevenueInCents:    Math.round(totalRevMu   / 10_000),
            totalExpensesInCents:   Math.round(totalExpMu   / 10_000),
            netProfitInMicrounits:  netProfitMu,
            totalRevenueInMicrounits: totalRevMu,
            totalExpensesInMicrounits: totalExpMu,
        };
    }, [metrics]);

    return {
        // State
        viewMode,
        journalEntries: journalEntries as JournalEntry[],
        accounts: accounts as Account[],
        bankTransactions: bankTransactions as BankTransaction[],
        expenseClaims: expenseClaims as ExpenseClaim[],
        metrics: metricsWithCents,
        accountingMetrics,
        isLoading,
        ledgerData,
        ledger,

        // Computed reports
        generatePandL,
        generateBalanceSheet,

        // Actions
        toggleViewMode,
        addJournalEntry: async (entry: JournalEntry) => {
            const id = entry.id || `tx_${Date.now()}`;
            return accountingForge.mutate('SET', id, entry);
        },
        validateJournalEntry: async (_id: string) => {
            throw new Error('[NF525_VIOLATION] Les entrées du grand livre sont immuables et ne peuvent pas être modifiées directement.');
        },
    };
}
