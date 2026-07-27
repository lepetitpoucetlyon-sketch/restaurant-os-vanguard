"use client";

import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { 
    journalEntriesNodeAtom, 
    accountsAtom, 
    bankTransactionsAtom, 
    expenseClaimsAtom 
} from '@/store/pillars/finance';
import { fiscalLedgerNodeAtom } from '@/store/pillars/compliance';
import { tenantIdAtom, currentUserAtom } from '@/store/pillars/sovereign';

import { SovereignMath } from '@shared/services/SovereignMath';
import { OperationalIdentity } from '@/shared/nexus-contract';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { BlockchainLedgerService } from '@/modules/finance/accounting/domain/BlockchainLedgerService';
import { computeTreasury } from '@/domain/services/TreasuryCalculator';
import { 
    JournalEntry,
    Account,
    BankTransaction,
    ExpenseClaim,
    TreasurySnapshot,
    FiscalSeal
} from '@modules/finance/types';
import type { TreasuryMetrics } from '@/domain/schemas/finance';
import { useBilling } from '@modules/finance/billing/hooks/useBilling';
import { useTaskContext } from '@/lib/icm/useTaskContext';

import { Sentry } from '@/lib/sentry';
import { toMicrounits } from '@/domain/schemas/primitives';

/**
 * 🏛️ SovereignSignable
 */
interface SovereignSignable {
    amountInMicrounits: number;
    category: string;
    date: string;
    merchantName?: string;
    [key: string]: unknown;
}

/**
 * 🛡️ ComplianceDocument - Grade X Agnostic Structure
 */
export interface ComplianceDocument {
    id: string;
    type: string;
    status: 'VALID' | 'EXPIRED' | 'PENDING';
    issuedAt: string;
    expiresAt: string;
    metadata: Record<string, import("@/shared/nexus-contract").SovereignValue>;
}

export interface NexusFiscalState {
    accounting: {
        entries: JournalEntry[];
        accounts: Account[];
        bankTransactions: BankTransaction[];
        expenseClaims: ExpenseClaim[];
        isLoading: boolean;
        metrics: { netProfitInMicrounits: number };
        submitExpense: (data: Partial<ExpenseClaim>) => Promise<string | undefined>;
    };
    compliance: {
        seals: FiscalSeal[];
        runAudit: () => Promise<boolean>;
        documents: ComplianceDocument[]; 
    };
    finance: {
        treasury: TreasuryMetrics;
        cashSnapshot: TreasurySnapshot;
    };
}

const NexusFiscalContext = createContext<NexusFiscalState | undefined>(undefined);

export const NexusFiscalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const tenantId = useAtomValue(tenantIdAtom);
    const currentUser = useAtomValue(currentUserAtom);
    const journalEntries = useAtomValue(journalEntriesNodeAtom);
    const accounts = useAtomValue(accountsAtom);
    const bankTransactions = useAtomValue(bankTransactionsAtom);
    const expenseClaims = useAtomValue(expenseClaimsAtom);
    const fiscalSeals = useAtomValue(fiscalLedgerNodeAtom);

    // 🛡️ SOVEREIGN MATH: Total elimination of native operators
    const netProfitInMicrounits = useMemo(() => {
        const entries = journalEntries.data;
        const total = entries.reduce((acc: number, entry) => {
            const amount = Number(entry.amountInMicrounits || 0);
            return entry.type === 'revenue' ? SovereignMath.add(acc, amount) : SovereignMath.subtract(acc, amount);
        }, 0);
        return total;
    }, [journalEntries.data]);

    // Produits & charges séparés (pour le résumé P&L de la trésorerie).
    const { totalRevenueMu, totalExpensesMu } = useMemo(() => {
        let rev = 0, exp = 0;
        for (const entry of journalEntries.data) {
            const amount = Number(entry.amountInMicrounits || 0);
            if (entry.type === 'revenue') rev = SovereignMath.add(rev, amount);
            else if (entry.type === 'expense') exp = SovereignMath.add(exp, amount);
        }
        return { totalRevenueMu: rev, totalExpensesMu: exp };
    }, [journalEntries.data]);

    const generateBusinessSignature = (data: SovereignSignable): string => {
        const payload = `${data.amountInMicrounits}|${data.category}|${data.merchantName || 'NONE'}|${data.date}`;
        let hash = 0;
        for (let i = 0; i < payload.length; i++) {
            const char = payload.charCodeAt(i);
            // 🛡️ NO NATIVE MULTIPLY
            hash = SovereignMath.add(SovereignMath.multiply(hash, 31), char);
        }
        return `SIG_${Math.abs(hash).toString(36).toUpperCase()}`;
    };

    const submitExpense = useCallback(async (expenseData: Partial<ExpenseClaim>) => {
        if (!tenantId || !currentUser) throw new Error("FISCAL_SESSION_ERROR");

        try {
            const finalData: SovereignSignable = {
                ...expenseData,
                amountInMicrounits: Number(expenseData.amountInMicrounits || 0),
                category: expenseData.category || 'other',
                date: expenseData.submittedAt ? new Date(expenseData.submittedAt).toISOString() : new Date().toISOString()
            };

            const businessSignature = generateBusinessSignature(finalData);
            const idempotencyKey = `FISCAL_${tenantId}_${businessSignature}`;

            Sentry.setTag("fiscal.idempotency_key", idempotencyKey);
            Sentry.setTag("nexus.grade", "X+++");

            const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}`;
            const id = Nexus.adapter.generateId(path);

            await Nexus.adapter.set(`${path}/${id}`, {
                ...expenseData,
                id,
                idempotencyKey,
                updatedAt: new Date().toISOString()
            });

            return id;
        } catch (error) {
            Sentry.captureException(error, { tags: { source: 'fiscal', tenantId } });
            throw error;
        }
    }, [tenantId, currentUser]);

    const runFiscalAudit = useCallback(async (): Promise<boolean> => {
        logger.info("[NexusFiscal] Running NF525 Integrity Audit...");
        const intact = await BlockchainLedgerService.auditFullChain();
        logger.info(`[NexusFiscal] Audit terminé — chaîne ${intact ? 'intacte' : 'BRISÉE'}`);
        return intact;
    }, []);

    // 💰 CASH SNAPSHOT — position de trésorerie réelle depuis les écritures Nexus
    // (PCG 53x caisse / 512x banque / 411x créances / 401x dettes). Remplace le stub zéro.
    const cashSnapshot: TreasurySnapshot = useMemo(
        () => computeTreasury(journalEntries.data),
        [journalEntries.data],
    );

    // 💰 TREASURY — résumé P&L (produits / charges / résultat), désormais calculé.
    const treasury: TreasuryMetrics = useMemo(() => {
        const marginRate = totalRevenueMu > 0
            ? Math.max(-1, Math.min(1, netProfitInMicrounits / totalRevenueMu))
            : 0;
        const now = Date.now();
        return {
            totalRevenueInMicrounits: toMicrounits(totalRevenueMu),
            totalExpensesInMicrounits: toMicrounits(totalExpensesMu),
            netProfitInMicrounits,
            marginRate,
            forecastedRevenueInMicrounits: toMicrounits(totalRevenueMu),
            cashPositionInMicrounits: cashSnapshot.netCashPositionInMicrounits,
            periodStart: now - 30 * 86_400_000,
            periodEnd: now,
        };
    }, [totalRevenueMu, totalExpensesMu, netProfitInMicrounits, cashSnapshot]);

    const contextValue: NexusFiscalState = useMemo(() => ({
        accounting: {
            entries: journalEntries.data,
            accounts,
            bankTransactions,
            expenseClaims,
            isLoading: journalEntries.loading || false,
            metrics: { netProfitInMicrounits },
            submitExpense
        },
        compliance: {
            seals: fiscalSeals.data as unknown as FiscalSeal[],
            runAudit: runFiscalAudit,
            documents: [] as ComplianceDocument[] 
        },
        finance: {
            treasury,
            cashSnapshot
        }
    }), [journalEntries, accounts, bankTransactions, expenseClaims, netProfitInMicrounits, submitExpense, fiscalSeals, runFiscalAudit, treasury, cashSnapshot]);

    const taskContext = useTaskContext();
    const financeActive = taskContext.importance.finance !== 'OFF';
    useBilling({ enabled: financeActive });

    return (
        <NexusFiscalContext.Provider value={contextValue}>
            {children}
        </NexusFiscalContext.Provider>
    );
};

export const useNexusFiscal = () => {
    const context = useContext(NexusFiscalContext);
    if (!context) throw new Error("useNexusFiscal must be used within NexusFiscalProvider");
    return context;
};

export const useCompliance = () => useNexusFiscal().compliance;
export const useAccounting = () => useNexusFiscal().accounting;
export const useFinance = () => useNexusFiscal().finance;
export const useFinanceReflex = () => useNexusFiscal(); // Fallback if reflex is needed
export const useFiscal = () => useNexusFiscal();
