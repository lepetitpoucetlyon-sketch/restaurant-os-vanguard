import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignQuotes } from '@/modules/commerce/hooks/useSovereignQuotes';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_quotes';

describe('useSovereignQuotes — Adapter commerce (devis)', () => {
    let mockAdapter: MockAdapter;
    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('create() → status=draft', async () => {
        const { result } = renderHook(() => useSovereignQuotes({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ subject: 'Buffet mariage', customerName: 'X' });
        });
        expect(id).toMatch(/^qte_/);
        expect(result.current.data[0].status).toBe('draft');
    });

    it('cycle send → accept → convert', async () => {
        const { result } = renderHook(() => useSovereignQuotes({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ subject: 'Test' });
        });
        await waitFor(() => expect(result.current.data.find(q => q.id === id)).toBeDefined());

        await act(async () => { await result.current.send(id); });
        expect(result.current.data.find(q => q.id === id)?.status).toBe('sent');
        expect(result.current.data.find(q => q.id === id)?.sentAt).toBeDefined();

        await act(async () => { await result.current.accept(id); });
        expect(result.current.data.find(q => q.id === id)?.status).toBe('accepted');

        await act(async () => { await result.current.convert(id, 'ord_999'); });
        const c = result.current.data.find(q => q.id === id);
        expect(c?.status).toBe('converted');
        expect(c?.convertedOrderId).toBe('ord_999');
    });

    it('reject() met status=rejected', async () => {
        const { result } = renderHook(() => useSovereignQuotes({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        let id = '';
        await act(async () => {
            id = await result.current.create({});
            await result.current.reject(id);
        });
        expect(result.current.data.find(q => q.id === id)?.status).toBe('rejected');
    });

    it('customerId filter isole les devis d\'un client', async () => {
        await mockAdapter.set(`tenants/${TENANT}/quotes/q1`, {
            id: 'q1', status: 'draft', customerId: 'cus_A',
            createdAt: '', updatedAt: '',
        });
        await mockAdapter.set(`tenants/${TENANT}/quotes/q2`, {
            id: 'q2', status: 'draft', customerId: 'cus_B',
            createdAt: '', updatedAt: '',
        });

        const { result } = renderHook(() =>
            useSovereignQuotes({ tenantId: TENANT, customerId: 'cus_A', autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data.map(q => q.id)).toEqual(['q1']);
    });
});
