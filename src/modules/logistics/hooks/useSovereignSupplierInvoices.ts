"use client";

/**
 * useSovereignSupplierInvoices — Adapter souverain pour `supplierInvoices` (logistics).
 * ADR-011 Phase 3.
 *
 * Cas d'usage : facture fournisseur photographiée en cave (sans wifi), en attente
 * d'extraction/validation. Statut : draft → extracted → validated → posted.
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { ExtractedSupplierInvoice } from '../domain/schemas/supplier-invoice.schemas';

export type SupplierInvoiceStatus = 'draft' | 'extracted' | 'validated' | 'posted' | 'rejected';

export interface StoredSupplierInvoice {
    id: string;
    status: SupplierInvoiceStatus;
    supplierName?: string;
    receiptUrl?: string;
    extracted?: ExtractedSupplierInvoice;
    createdAt: number;
    updatedAt: number;
    postedJournalEntryId?: string; // trace vers l'écriture comptable (post-validation)
}

export interface UseSovereignSupplierInvoicesOptions {
    tenantId: string;
    statusFilter?: SupplierInvoiceStatus | SupplierInvoiceStatus[] | 'all';
    supplierName?: string;
    autoSync?: boolean;
}

export interface CreateSupplierInvoiceInput {
    receiptUrl?: string;
    supplierName?: string;
    extracted?: ExtractedSupplierInvoice;
}

export interface UseSovereignSupplierInvoicesResult {
    data: StoredSupplierInvoice[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateSupplierInvoiceInput) => Promise<string>;
    attachExtraction: (id: string, extracted: ExtractedSupplierInvoice) => Promise<void>;
    validate: (id: string) => Promise<void>;
    reject: (id: string) => Promise<void>;
    /** Marque postée (avec l'id du journal entry pour trace). */
    markPosted: (id: string, journalEntryId: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const now = (): number => Date.now();

export function useSovereignSupplierInvoices(
    options: UseSovereignSupplierInvoicesOptions,
): UseSovereignSupplierInvoicesResult {
    const { tenantId, statusFilter = 'all', supplierName, autoSync } = options;

    const filter = useMemo(() => {
        if (statusFilter === 'all' && !supplierName) return undefined;
        const statuses = statusFilter === 'all'
            ? null
            : Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        return (item: StoredSupplierInvoice) => {
            if (statuses && !statuses.includes(item.status)) return false;
            if (supplierName && item.supplierName !== supplierName) return false;
            return true;
        };
    }, [statusFilter, supplierName]);

    const {
        data, isLoading, isSyncing, error,
        set, update, delete: del, refresh,
    } = useSovereignCollection<StoredSupplierInvoice>('supplierInvoices', { tenantId, autoSync, filter });

    const create = useCallback(async (input: CreateSupplierInvoiceInput): Promise<string> => {
        const id = `sinv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const nowTs = now();
        const item: StoredSupplierInvoice = {
            id,
            status: input.extracted ? 'extracted' : 'draft',
            supplierName: input.supplierName ?? input.extracted?.invoice_metadata?.supplier?.name,
            receiptUrl: input.receiptUrl,
            extracted: input.extracted,
            createdAt: nowTs,
            updatedAt: nowTs,
        };
        await set(item);
        return id;
    }, [set]);

    const attachExtraction = useCallback(async (id: string, extracted: ExtractedSupplierInvoice) => {
        await update(id, {
            extracted,
            supplierName: extracted.invoice_metadata?.supplier?.name,
            status: 'extracted',
            updatedAt: now(),
        });
    }, [update]);

    const validate = useCallback(async (id: string) => {
        await update(id, { status: 'validated', updatedAt: now() });
    }, [update]);

    const reject = useCallback(async (id: string) => {
        await update(id, { status: 'rejected', updatedAt: now() });
    }, [update]);

    const markPosted = useCallback(async (id: string, journalEntryId: string) => {
        await update(id, {
            status: 'posted',
            postedJournalEntryId: journalEntryId,
            updatedAt: now(),
        });
    }, [update]);

    return {
        data, isLoading, isSyncing, error,
        create, attachExtraction, validate, reject, markPosted,
        remove: del, refresh,
    };
}
