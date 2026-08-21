"use client";

/**
 * useSovereignCustomers — Adapter souverain pour `customers` (CRM commerce).
 * ADR-012 Phase 4.
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { Customer } from '@/shared/nexus/contracts/customer.types';

export interface UseSovereignCustomersOptions {
    tenantId: string;
    segment?: string;
    search?: string;
    autoSync?: boolean;
}

export interface CreateCustomerInput {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    tags?: string[];
    preferences?: string[];
    segment?: string;
    notes?: string;
}

export interface UseSovereignCustomersResult {
    data: Customer[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateCustomerInput) => Promise<string>;
    updateContact: (id: string, patch: { phone?: string; email?: string }) => Promise<void>;
    addTag: (id: string, tag: string) => Promise<void>;
    removeTag: (id: string, tag: string) => Promise<void>;
    setSegment: (id: string, segment: string) => Promise<void>;
    recordVisit: (id: string, amountInMicrounits?: number) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useSovereignCustomers(options: UseSovereignCustomersOptions): UseSovereignCustomersResult {
    const { tenantId, segment, search, autoSync } = options;
    const q = search?.trim().toLowerCase();

    const filter = useMemo(() => {
        if (!segment && !q) return undefined;
        return (c: Customer) => {
            if (segment && c.segment !== segment) return false;
            if (q) {
                const hay = `${c.firstName} ${c.lastName} ${c.phone} ${c.email ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        };
    }, [segment, q]);

    const {
        data, isLoading, isSyncing, error,
        set, update, delete: del, refresh,
    } = useSovereignCollection<Customer>('customers', { tenantId, autoSync, filter });

    const create = useCallback(async (input: CreateCustomerInput): Promise<string> => {
        const id = `cus_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const customer: Customer = {
            id,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            email: input.email,
            tags: input.tags ?? [],
            preferences: input.preferences ?? [],
            visitCount: 0,
            segment: input.segment ?? 'new',
            notes: input.notes,
            createdAt: now,
            updatedAt: now,
        } as unknown as Customer;
        await set(customer);
        return id;
    }, [set]);

    const updateContact = useCallback(async (id: string, patch: { phone?: string; email?: string }) => {
        await update(id, patch as Partial<Customer>);
    }, [update]);

    const addTag = useCallback(async (id: string, tag: string) => {
        const c = data.find(x => x.id === id);
        if (!c) return;
        if (c.tags.includes(tag)) return;
        await update(id, { tags: [...c.tags, tag] } as Partial<Customer>);
    }, [data, update]);

    const removeTag = useCallback(async (id: string, tag: string) => {
        const c = data.find(x => x.id === id);
        if (!c) return;
        await update(id, { tags: c.tags.filter(t => t !== tag) } as Partial<Customer>);
    }, [data, update]);

    const setSegment = useCallback(async (id: string, segment: string) => {
        await update(id, { segment } as Partial<Customer>);
    }, [update]);

    const recordVisit = useCallback(async (id: string, amountInMicrounits?: number) => {
        const c = data.find(x => x.id === id);
        if (!c) return;
        const nextCount = c.visitCount + 1;
        const nextTotal = (c.totalSpentInMicrounits ?? 0) + (amountInMicrounits ?? 0);
        const nextAvg = nextCount > 0 ? Math.round(nextTotal / nextCount) : 0;
        await update(id, {
            visitCount: nextCount,
            totalSpentInMicrounits: nextTotal,
            averageSpendInMicrounits: nextAvg,
            lastVisitDate: new Date().toISOString(),
        } as Partial<Customer>);
    }, [data, update]);

    return {
        data, isLoading, isSyncing, error,
        create, updateContact, addTag, removeTag, setSegment, recordVisit,
        remove: del, refresh,
    };
}
