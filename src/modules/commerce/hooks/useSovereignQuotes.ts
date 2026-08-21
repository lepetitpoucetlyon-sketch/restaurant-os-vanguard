"use client";

/**
 * useSovereignQuotes — Adapter souverain pour `quotes` (devis).
 * ADR-012 Phase 4.
 * Cas d'usage : commercial qui édite un devis chez un client (offline).
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';

/** Statuts métier standard du cycle devis. */
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface StoredQuote {
    id: string;
    quoteNumber?: string;
    status: QuoteStatus;
    customerId?: string;
    customerName?: string;
    subject?: string;
    validUntil?: string;
    totalTTCInMicrounits?: number;
    sections?: unknown[];
    createdAt: string;
    updatedAt: string;
    sentAt?: string;
    respondedAt?: string;
    convertedOrderId?: string;
}

export interface UseSovereignQuotesOptions {
    tenantId: string;
    statusFilter?: QuoteStatus | QuoteStatus[] | 'all';
    customerId?: string;
    autoSync?: boolean;
}

export interface CreateQuoteInput {
    subject?: string;
    customerId?: string;
    customerName?: string;
    validUntil?: string;
    sections?: unknown[];
    totalTTCInMicrounits?: number;
}

export interface UseSovereignQuotesResult {
    data: StoredQuote[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateQuoteInput) => Promise<string>;
    updateContent: (id: string, patch: Partial<StoredQuote>) => Promise<void>;
    send: (id: string) => Promise<void>;
    accept: (id: string) => Promise<void>;
    reject: (id: string) => Promise<void>;
    /** Convertit en commande (le orderId doit venir de useSovereignOrders.create côté ops). */
    convert: (id: string, orderId: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const nowIso = () => new Date().toISOString();

export function useSovereignQuotes(options: UseSovereignQuotesOptions): UseSovereignQuotesResult {
    const { tenantId, statusFilter = 'all', customerId, autoSync } = options;

    const filter = useMemo(() => {
        if (statusFilter === 'all' && !customerId) return undefined;
        const statuses = statusFilter === 'all'
            ? null
            : Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        return (q: StoredQuote) => {
            if (statuses && !statuses.includes(q.status)) return false;
            if (customerId && q.customerId !== customerId) return false;
            return true;
        };
    }, [statusFilter, customerId]);

    const {
        data, isLoading, isSyncing, error,
        set, update, delete: del, refresh,
    } = useSovereignCollection<StoredQuote>('quotes', { tenantId, autoSync, filter });

    const create = useCallback(async (input: CreateQuoteInput): Promise<string> => {
        const id = `qte_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = nowIso();
        const quote: StoredQuote = {
            id,
            status: 'draft',
            customerId: input.customerId,
            customerName: input.customerName,
            subject: input.subject,
            validUntil: input.validUntil,
            sections: input.sections ?? [],
            totalTTCInMicrounits: input.totalTTCInMicrounits,
            createdAt: now,
            updatedAt: now,
        };
        await set(quote);
        return id;
    }, [set]);

    const updateContent = useCallback(async (id: string, patch: Partial<StoredQuote>) => {
        await update(id, { ...patch, updatedAt: nowIso() });
    }, [update]);

    const send = useCallback(async (id: string) => {
        await update(id, { status: 'sent', sentAt: nowIso(), updatedAt: nowIso() });
    }, [update]);

    const accept = useCallback(async (id: string) => {
        await update(id, { status: 'accepted', respondedAt: nowIso(), updatedAt: nowIso() });
    }, [update]);

    const reject = useCallback(async (id: string) => {
        await update(id, { status: 'rejected', respondedAt: nowIso(), updatedAt: nowIso() });
    }, [update]);

    const convert = useCallback(async (id: string, orderId: string) => {
        await update(id, { status: 'converted', convertedOrderId: orderId, updatedAt: nowIso() });
    }, [update]);

    return {
        data, isLoading, isSyncing, error,
        create, updateContent, send, accept, reject, convert,
        remove: del, refresh,
    };
}
