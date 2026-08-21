/**
 * useSovereignStocks — Tests adapter pilier logistics.
 * ADR-011 Phase 3.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignStocks } from '@/modules/logistics/hooks/useSovereignStocks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_stocks';

describe('useSovereignStocks — Adapter logistics (stocks)', () => {
    let mockAdapter: MockAdapter;
    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('n\'est pas bloqué par NF525', () => {
        expect(() =>
            renderHook(() => useSovereignStocks({ tenantId: TENANT, autoSync: false })),
        ).not.toThrow();
    });

    it('create() ajoute un article avec quantité par défaut 0', async () => {
        const { result } = renderHook(() => useSovereignStocks({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ name: 'Farine T65', unit: 'kg' });
        });
        expect(id).toMatch(/^stk_/);
        expect(result.current.data[0].quantityInStock).toBe(0);
    });

    it('adjustQuantity() clampe à zéro', async () => {
        const { result } = renderHook(() => useSovereignStocks({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ name: 'Beurre', unit: 'kg', quantityInStock: 3 });
        });
        await waitFor(() => expect(result.current.data.find(s => s.id === id)).toBeDefined());
        await act(async () => {
            await result.current.adjustQuantity(id, -10);
        });
        expect(result.current.data.find(s => s.id === id)?.quantityInStock).toBe(0);
    });

    it('setQuantity() refuse une valeur négative', async () => {
        const { result } = renderHook(() => useSovereignStocks({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ name: 'X', unit: 'unit' });
        });
        await expect(async () => {
            await act(async () => {
                await result.current.setQuantity(id, -5);
            });
        }).rejects.toThrow(/négatif/);
    });

    it('onlyBelowThreshold=true filtre les articles au-dessus du seuil', async () => {
        await mockAdapter.set(`tenants/${TENANT}/stocks/s1`, {
            id: 's1', type: 'stockItem', name: 'Low',
            unit: 'kg', quantityInStock: 2, threshold: 5,
            schemaVersion: 2, updatedAt: Date.now(),
        });
        await mockAdapter.set(`tenants/${TENANT}/stocks/s2`, {
            id: 's2', type: 'stockItem', name: 'Ok',
            unit: 'kg', quantityInStock: 20, threshold: 5,
            schemaVersion: 2, updatedAt: Date.now(),
        });

        const { result } = renderHook(() =>
            useSovereignStocks({ tenantId: TENANT, onlyBelowThreshold: true, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data.map(s => s.id)).toEqual(['s1']);
    });

    it('stampAudit() met lastAuditDate à jour', async () => {
        const { result } = renderHook(() => useSovereignStocks({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ name: 'A', unit: 'unit' });
        });
        await waitFor(() => expect(result.current.data.find(s => s.id === id)).toBeDefined());
        await act(async () => {
            await result.current.stampAudit(id);
        });
        expect(result.current.data.find(s => s.id === id)?.lastAuditDate).toBeDefined();
    });
});
