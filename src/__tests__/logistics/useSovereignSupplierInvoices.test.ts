/**
 * useSovereignSupplierInvoices — Tests adapter pilier logistics.
 * ADR-011 Phase 3.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignSupplierInvoices } from '@/modules/logistics/hooks/useSovereignSupplierInvoices';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_sinv';

describe('useSovereignSupplierInvoices — Adapter logistics', () => {
    let mockAdapter: MockAdapter;
    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('n\'est pas bloqué par NF525', () => {
        expect(() =>
            renderHook(() => useSovereignSupplierInvoices({ tenantId: TENANT, autoSync: false })),
        ).not.toThrow();
    });

    it('create() sans extraction → status=draft', async () => {
        const { result } = renderHook(() =>
            useSovereignSupplierInvoices({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ receiptUrl: 'blob://photo1' });
        });
        expect(id).toMatch(/^sinv_/);
        expect(result.current.data[0].status).toBe('draft');
    });

    it('cycle attachExtraction → validate → markPosted', async () => {
        const { result } = renderHook(() =>
            useSovereignSupplierInvoices({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ receiptUrl: 'blob://p' });
        });
        await waitFor(() => expect(result.current.data.find(i => i.id === id)).toBeDefined());

        await act(async () => {
            await result.current.attachExtraction(id, {
                invoice_metadata: { supplier: { name: 'Metro' } },
            } as never);
        });
        expect(result.current.data.find(i => i.id === id)?.status).toBe('extracted');
        expect(result.current.data.find(i => i.id === id)?.supplierName).toBe('Metro');

        await act(async () => {
            await result.current.validate(id);
        });
        expect(result.current.data.find(i => i.id === id)?.status).toBe('validated');

        await act(async () => {
            await result.current.markPosted(id, 'jrn_123');
        });
        const posted = result.current.data.find(i => i.id === id);
        expect(posted?.status).toBe('posted');
        expect(posted?.postedJournalEntryId).toBe('jrn_123');
    });

    it('reject() met status=rejected', async () => {
        const { result } = renderHook(() =>
            useSovereignSupplierInvoices({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({});
            await result.current.reject(id);
        });
        expect(result.current.data.find(i => i.id === id)?.status).toBe('rejected');
    });

    it('statusFilter=draft filtre au chargement', async () => {
        await mockAdapter.set(`tenants/${TENANT}/supplierInvoices/a`, {
            id: 'a', status: 'draft', createdAt: Date.now(), updatedAt: Date.now(),
        });
        await mockAdapter.set(`tenants/${TENANT}/supplierInvoices/b`, {
            id: 'b', status: 'posted', createdAt: Date.now(), updatedAt: Date.now(),
        });

        const { result } = renderHook(() =>
            useSovereignSupplierInvoices({ tenantId: TENANT, statusFilter: 'draft', autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data.map(i => i.id)).toEqual(['a']);
    });
});
