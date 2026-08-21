import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignCustomers } from '@/modules/commerce/hooks/useSovereignCustomers';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_cust';

describe('useSovereignCustomers — Adapter commerce (CRM)', () => {
    let mockAdapter: MockAdapter;
    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('n\'est pas bloqué par NF525', () => {
        expect(() =>
            renderHook(() => useSovereignCustomers({ tenantId: TENANT, autoSync: false })),
        ).not.toThrow();
    });

    it('create() ajoute un client avec compteurs à 0', async () => {
        const { result } = renderHook(() => useSovereignCustomers({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                firstName: 'Marie', lastName: 'Dupont', phone: '+33600',
            });
        });
        expect(id).toMatch(/^cus_/);
        expect(result.current.data[0].visitCount).toBe(0);
        expect(result.current.data[0].segment).toBe('new');
    });

    it('recordVisit() incrémente compteur + total + calcule moyenne', async () => {
        const { result } = renderHook(() => useSovereignCustomers({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ firstName: 'A', lastName: 'B', phone: '+3311' });
        });
        await waitFor(() => expect(result.current.data.find(c => c.id === id)).toBeDefined());
        await act(async () => {
            await result.current.recordVisit(id, 30_000_000);
        });
        const after = result.current.data.find(c => c.id === id);
        expect(after?.visitCount).toBe(1);
        expect(after?.totalSpentInMicrounits).toBe(30_000_000);
        expect(after?.averageSpendInMicrounits).toBe(30_000_000);
    });

    it('addTag() ne double pas un tag existant', async () => {
        const { result } = renderHook(() => useSovereignCustomers({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ firstName: 'X', lastName: 'Y', phone: '+3300' });
        });
        await waitFor(() => expect(result.current.data.find(c => c.id === id)).toBeDefined());
        await act(async () => {
            await result.current.addTag(id, 'VIP');
            await result.current.addTag(id, 'VIP');
        });
        expect(result.current.data.find(c => c.id === id)?.tags.filter(t => t === 'VIP')).toHaveLength(1);
    });

    it('search filter matches nom OU téléphone', async () => {
        await mockAdapter.set(`tenants/${TENANT}/customers/a`, {
            id: 'a', firstName: 'Alice', lastName: 'Martin', phone: '+331',
            tags: [], preferences: [], visitCount: 0, createdAt: '', updatedAt: '',
        });
        await mockAdapter.set(`tenants/${TENANT}/customers/b`, {
            id: 'b', firstName: 'Bob', lastName: 'Durand', phone: '+332',
            tags: [], preferences: [], visitCount: 0, createdAt: '', updatedAt: '',
        });

        const { result } = renderHook(() =>
            useSovereignCustomers({ tenantId: TENANT, search: 'alice', autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data.map(c => c.id)).toEqual(['a']);
    });
});
