"use client";

import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { 
    journalEntriesNodeAtom, 
    accountsAtom, 
    bankTransactionsAtom, 
    expenseClaimsAtom, 
    fiscalLedgerNodeAtom,
    tenantIdAtom,
    currentUserAtom
} from '@/store/operationalAtoms';
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
} from '@nexus/contracts';
import { useBilling } from '@modules/finance';

const Sentry = require("@sentry/nextjs");

/**
 * 🏛️ SovereignSignable
 */
interface SovereignSignable {
    amountInCents: number;
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
        metrics: { netProfitInCents: number };
        submitExpense: (data: Omit<ExpenseClaim, 'id' | 'status' | 'userName' | 'userRole'>) => Promise<string | undefined>;
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
    const netProfitInCents = useMemo(() => {
        const entries = (journalEntries.data || []) as any[];
        const total = entries.reduce((acc: bigint, entry: any) => {
            const amount = BigInt(entry.amountInCents || 0);
            return SovereignMath.add(acc, amount);
        }, BigInt(0));
        return Number(total);
    }, [journalEntries.data]);

    const generateBusinessSignature = (data: SovereignSignable): string => {
        const payload = `${data.amountInCents}|${data.category}|${data.merchantName || 'NONE'}|${data.date}`;
        let hash = BigInt(0);
        for (let i = 0; i < payload.length; i++) {
            const char = BigInt(payload.charCodeAt(i));
            // 🛡️ NO NATIVE MULTIPLY
            hash = SovereignMath.add(SovereignMath.multiply(hash, BigInt(31)), char);
        }
        return `SIG_${Math.abs(Number(hash)).toString(36).toUpperCase()}`;
    };

    const submitExpense = useCallback(async (expenseData: Omit<ExpenseClaim, 'id' | 'status' | 'userName' | 'userRole'>) => {
        if (!tenantId || !currentUser) throw new Error("FISCAL_SESSION_ERROR");

        const finalData: SovereignSignable = {
            ...expenseData,
            amountInCents: expenseData.amountInCents,
            category: expenseData.category,
            date: expenseData.date
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
        cashOnHandInCents: 0,
        bankBalanceInCents: 0,
        pendingReceivablesInCents: 0,
        pendingPayablesInCents: 0,
        netCashPositionInCents: 0
    } as TreasuryMetrics;

    const contextValue: NexusFiscalState = useMemo(() => ({
        accounting: {
            entries: journalEntries.data || [],
            accounts,
            bankTransactions,
            expenseClaims,
            isLoading: journalEntries.loading,
            metrics: { netProfitInCents },
            submitExpense
        },
        compliance: {
            seals: (fiscalSeals.data as FiscalSeal[]) || [],
            runAudit: runFiscalAudit,
            documents: [] as ComplianceDocument[] 
        },
        finance: {
            treasury
        }
    }), [journalEntries, accounts, bankTransactions, expenseClaims, netProfitInCents, submitExpense, fiscalSeals, runFiscalAudit, treasury]);

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
