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
import { useNexusMutation } from "@kernel/hooks/useNexusMutation";
import type { ProfitAndLossReport, BalanceSheetReport, LedgerAccount } from '@nexus/contracts/finance.types';

function computeLedger(accounts: Account[], journalEntries: JournalEntry[]): LedgerAccount[] {
    const muFromLine = (m: { debitInMicrounits?: number; debitInCents?: number; creditInMicrounits?: number; creditInCents?: number; amountInMicrounits?: number; amountInCents?: number }) => ({
        debitMu: m.debitInMicrounits ?? (m.debitInCents || 0) * 10_000,
        creditMu: m.creditInMicrounits ?? (m.creditInCents || 0) * 10_000,
        amountMu: m.amountInMicrounits ?? (m.amountInCents || 0) * 10_000,
    });
    return accounts.map(account => {
        const movements = journalEntries
            .flatMap(e => e.lines)
            .filter(l => l.accountId === account.id || l.accountCode === account.code);
        let runningMu = 0;
        const movementsWithBalance = movements.map(m => {
            const { debitMu, creditMu, amountMu } = muFromLine(m);
            runningMu += debitMu - creditMu;
            return {
                ...m,
                runningBalanceInMicrounits: runningMu,
                runningBalanceInCents: Math.round(runningMu / 10_000),
                debitInMicrounits: debitMu,
                debitInCents: Math.round(debitMu / 10_000),
                creditInMicrounits: creditMu,
                creditInCents: Math.round(creditMu / 10_000),
                amountInMicrounits: amountMu,
                amountInCents: Math.round(amountMu / 10_000),
            };
        });
        const debitTotalMu = movements.reduce((s, m) => s + (muFromLine(m).debitMu), 0);
        const creditTotalMu = movements.reduce((s, m) => s + (muFromLine(m).creditMu), 0);
        const balanceMu = (account.balanceInMicrounits ?? (account.balanceInCents ?? 0) * 10_000) || (debitTotalMu - creditTotalMu);
        return {
            ...account,
            balanceInMicrounits: balanceMu,
            balanceInCents: Math.round(balanceMu / 10_000),
            debitTotalInMicrounits: debitTotalMu,
            debitTotalInCents: Math.round(debitTotalMu / 10_000),
            creditTotalInMicrounits: creditTotalMu,
            creditTotalInCents: Math.round(creditTotalMu / 10_000),
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
        const entryAmountMu = (e: JournalEntry, side: 'credit' | 'debit'): number => {
            if (e.amountInMicrounits != null) return e.amountInMicrounits;
            return e.lines.reduce((s, l) => s + (l.side === side ? (l.amountInMicrounits ?? (l.amountInCents ?? 0) * 10_000) : 0), 0);
        };
        const revenues = journalEntries
            .filter(e => e.type === 'revenue')
            .map(e => {
                const mu = entryAmountMu(e, 'credit');
                return { category: e.type ?? 'revenue', accountCode: e.pieceNumber, accountName: e.description, amountInMicrounits: mu, amountInCents: Math.round(mu / 10_000) };
            });
        const expenses = journalEntries
            .filter(e => e.type === 'expense')
            .map(e => {
                const mu = entryAmountMu(e, 'debit');
                return { category: e.type ?? 'expense', accountCode: e.pieceNumber, accountName: e.description, amountInMicrounits: mu, amountInCents: Math.round(mu / 10_000) };
            });
        const totalRevenueMu = revenues.reduce((s, r) => s + r.amountInMicrounits, 0);
        const totalExpensesMu = expenses.reduce((s, e) => s + e.amountInMicrounits, 0);
        const netResultMu = totalRevenueMu - totalExpensesMu;
        return {
            periodId,
            periodName: 'Période courante',
            revenues,
            expenses,
            totalRevenueInMicrounits: totalRevenueMu,
            totalRevenueInCents: Math.round(totalRevenueMu / 10_000),
            totalExpensesInMicrounits: totalExpensesMu,
            totalExpensesInCents: Math.round(totalExpensesMu / 10_000),
            netResultInMicrounits: netResultMu,
            netResultInCents: Math.round(netResultMu / 10_000),
            generatedAt: new Date().toISOString(),
        };
    }, [journalEntries]);

    const generateBalanceSheet = useCallback((_asOfDate: Date = new Date()): BalanceSheetReport => {
        const toLine = (type: string, label: string) =>
            (accounts as Account[])
                .filter(a => a.type === type)
                .map(a => {
                    const mu = a.balanceInMicrounits ?? (a.balanceInCents ?? 0) * 10_000;
                    return { category: label, accountCode: a.code, accountName: a.name, amountInMicrounits: mu, amountInCents: Math.round(mu / 10_000) };
                });
        const assets = toLine('asset', 'Actif');
        const liabilities = toLine('liability', 'Passif');
        const equity = toLine('equity', 'Capitaux propres');
        const totalAssetsMu = assets.reduce((s, a) => s + a.amountInMicrounits, 0);
        const totalLiabilitiesMu = liabilities.reduce((s, l) => s + l.amountInMicrounits, 0);
        const totalEquityMu = equity.reduce((s, e) => s + e.amountInMicrounits, 0);
        return {
            asOfDate: new Date().toISOString(),
            assets,
            liabilities,
            equity,
            totalAssetsInMicrounits: totalAssetsMu,
            totalAssetsInCents: Math.round(totalAssetsMu / 10_000),
            totalLiabilitiesInMicrounits: totalLiabilitiesMu,
            totalLiabilitiesInCents: Math.round(totalLiabilitiesMu / 10_000),
            totalEquityInMicrounits: totalEquityMu,
            totalEquityInCents: Math.round(totalEquityMu / 10_000),
            isBalanced: Math.abs(totalAssetsMu - (totalLiabilitiesMu + totalEquityMu)) < 10_000,
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
