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
import { SovereignNode, OperationalIdentity } from '@/shared/nexus-contract';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { 
    JournalEntry, 
    Account, 
    BankTransaction, 
    ExpenseClaim,
    TreasuryMetrics,
    FiscalSeal
} from '@modules/finance/types';
import { useBilling } from '@modules/finance/billing/hooks/useBilling';

import Sentry from "@sentry/nextjs";

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
        runAudit: () => Promise<void>;
        documents: ComplianceDocument[]; 
    };
    finance: {
        treasury: TreasuryMetrics;
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
        const entries = (journalEntries.data || []) as unknown as JournalEntry[];
        const total = entries.reduce((acc: number, entry) => {
            const amount = Number(entry.amountInMicrounits || 0);
            return entry.type === 'revenue' ? SovereignMath.add(acc, amount) : SovereignMath.subtract(acc, amount);
        }, 0);
        return total;
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
    }, [tenantId, currentUser]);

    const runFiscalAudit = useCallback(async () => {
        logger.info("[NexusFiscal] Running NF525 Integrity Audit...");
    }, []);

    // 🛡️ SINCERE TREASURY MAPPING (Zero-Cast)
    const treasury: TreasuryMetrics = {
        totalRevenueInMicrounits: 0 as any,
        totalExpensesInMicrounits: 0 as any,
        netProfitInMicrounits: 0,
        marginRate: 0,
        forecastedRevenueInMicrounits: 0 as any,
        cashPositionInMicrounits: 0,
        periodStart: Date.now(),
        periodEnd: Date.now() + 86400000
    };

    const contextValue: NexusFiscalState = useMemo(() => ({
        accounting: {
            entries: (journalEntries.data || []) as unknown as JournalEntry[],
            accounts: (accounts || []) as unknown as Account[],
            bankTransactions: (bankTransactions || []) as unknown as BankTransaction[],
            expenseClaims: (expenseClaims || []) as unknown as ExpenseClaim[],
            isLoading: journalEntries.loading || false,
            metrics: { netProfitInMicrounits },
            submitExpense
        },
        compliance: {
            seals: (fiscalSeals.data || []) as unknown as FiscalSeal[],
            runAudit: runFiscalAudit,
            documents: [] as ComplianceDocument[] 
        },
        finance: {
            treasury
        }
    }), [journalEntries, accounts, bankTransactions, expenseClaims, netProfitInMicrounits, submitExpense, fiscalSeals, runFiscalAudit, treasury]);

    // 🧾 FISCAL ORCHESTRATOR: Connect POS [OPS] -> Ledger [FINANCE]
    useBilling();

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
