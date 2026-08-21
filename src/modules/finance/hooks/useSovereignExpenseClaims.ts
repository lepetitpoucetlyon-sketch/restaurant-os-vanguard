"use client";

/**
 * useSovereignExpenseClaims — Adapter du kernel `useSovereignCollection`
 * pour la collection MUTABLE `expenseClaims` du pilier finance.
 *
 * ADR-009 — Migration progressive vers useSovereignCollection.
 *
 * Cette collection est mutable (workflow submit → approve/reject → reimburse)
 * et NE fait PAS partie de NF525_IMMUTABLE_COLLECTIONS. Elle est donc
 * éligible au hook souverain (offline-first via Dexie + Outbox).
 *
 * Ne pas confondre avec :
 *   - journalEntries : IMMUABLE NF525 (chaîne de sceaux via FinancialNexusBridge)
 *   - fiscalSeals / fiscalLedger : IMMUABLES NF525 (WORM)
 *
 * Usage :
 *   const { data, submit, approve, reject, reimburse, isSyncing } =
 *     useSovereignExpenseClaims({ tenantId });
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { ExpenseClaim } from '../domain/schemas/finance';

export interface UseSovereignExpenseClaimsOptions {
    tenantId: string;
    /** Filtre optionnel (ex : n'afficher que 'pending'). */
    statusFilter?: ExpenseClaim['status'] | 'all';
    /** Désactive la synchro auto (utile pour les tests). */
    autoSync?: boolean;
}

export interface SubmitExpenseInput {
    submittedBy: string;
    amountInMicrounits: number;
    category: ExpenseClaim['category'];
    description: string;
    receiptUrl?: string;
}

export interface UseSovereignExpenseClaimsResult {
    /** Liste offline-first (Dexie cache + réconciliation cloud). */
    data: ExpenseClaim[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    /** Soumettre une note de frais (status = 'pending'). */
    submit: (input: SubmitExpenseInput) => Promise<string>;
    /** Approuver (change status → 'approved', trace approvedBy + processedAt). */
    approve: (id: string, approvedBy: string) => Promise<void>;
    /** Rejeter (change status → 'rejected', trace processedAt). */
    reject: (id: string, approvedBy: string) => Promise<void>;
    /** Marquer remboursée (status = 'reimbursed'). */
    reimburse: (id: string) => Promise<void>;
    /** Suppression brute (ex: annulation avant approbation). */
    remove: (id: string) => Promise<void>;
    /** Force un refresh depuis le cloud. */
    refresh: () => Promise<void>;
}

const nowIso = (): string => new Date().toISOString();

export function useSovereignExpenseClaims(
    options: UseSovereignExpenseClaimsOptions,
): UseSovereignExpenseClaimsResult {
    const { tenantId, statusFilter = 'all', autoSync } = options;

    const filter = useMemo(() => {
        if (statusFilter === 'all') return undefined;
        return (item: ExpenseClaim) => item.status === statusFilter;
    }, [statusFilter]);

    const {
        data,
        isLoading,
        isSyncing,
        error,
        set,
        update,
        delete: del,
        refresh,
    } = useSovereignCollection<ExpenseClaim>('expenseClaims', {
        tenantId,
        autoSync,
        filter,
    });

    const submit = useCallback(
        async (input: SubmitExpenseInput): Promise<string> => {
            const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const claim: ExpenseClaim = {
                id,
                submittedBy: input.submittedBy,
                amountInMicrounits: input.amountInMicrounits as ExpenseClaim['amountInMicrounits'],
                category: input.category,
                description: input.description,
                receiptUrl: input.receiptUrl,
                status: 'pending',
                submittedAt: nowIso(),
                userName: 'Unknown',
                userRole: 'employee',
            } as unknown as ExpenseClaim;
            await set(claim);
            return id;
        },
        [set],
    );

    const approve = useCallback(
        async (id: string, approvedBy: string) => {
            await update(id, {
                status: 'approved',
                approvedBy: approvedBy as ExpenseClaim['approvedBy'],
                processedAt: nowIso(),
            } as unknown as Partial<ExpenseClaim>);
        },
        [update],
    );

    const reject = useCallback(
        async (id: string, approvedBy: string) => {
            await update(id, {
                status: 'rejected',
                approvedBy: approvedBy as ExpenseClaim['approvedBy'],
                processedAt: nowIso(),
            } as unknown as Partial<ExpenseClaim>);
        },
        [update],
    );

    const reimburse = useCallback(
        async (id: string) => {
            await update(id, {
                status: 'reimbursed',
                processedAt: nowIso(),
            } as unknown as Partial<ExpenseClaim>);
        },
        [update],
    );

    return {
        data,
        isLoading,
        isSyncing,
        error,
        submit,
        approve,
        reject,
        reimburse,
        remove: del,
        refresh,
    };
}
