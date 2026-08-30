/**
 * useSovereignOrders — Tests adapter pilier ops (KDS/POS).
 * ADR-010 Phase 2 — preuve end-to-end orders offline-first.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignOrders } from '@/modules/ops/hooks/useSovereignOrders';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { OrderLine } from '@/modules/ops/domain/schemas/orders';

const TENANT = 'tenant_test_orders';

const sampleItem = (name = 'Steak', qty = 1): OrderLine => ({
    id: `line_${name}_${qty}`,
    productId: '11111111-1111-4111-8111-111111111111',
    name,
    quantity: qty,
    modifiers: [],
    unitPriceInMicrounits: toMicrounits(15),
    taxRate: 10,
    discountInMicrounits: toMicrounits(0),
    status: 'pending',
} as unknown as OrderLine);

describe('useSovereignOrders — Adapter ops (orders)', () => {
    let mockAdapter: MockAdapter;

    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('n\'est pas bloqué par NF525 (orders est mutable)', () => {
        expect(() =>
            renderHook(() => useSovereignOrders({ tenantId: TENANT, autoSync: false })),
        ).not.toThrow();
    });

    it('create() ajoute une commande pending avec ID généré', async () => {
        const { result } = renderHook(() =>
            useSovereignOrders({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                items: [sampleItem('Pizza')],
                tableId: 'tbl_1',
                tableNumber: '3',
                covers: 2,
            });
        });

        expect(id).toMatch(/^ord_/);
        expect(result.current.data).toHaveLength(1);
        expect(result.current.data[0].status).toBe('pending');
        expect(result.current.data[0].tableNumber).toBe('3');
    });

    it('setStatus() progresse le cycle pending → cooking → ready → served', async () => {
        const { result } = renderHook(() =>
            useSovereignOrders({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ items: [sampleItem()] });
        });

        for (const s of ['cooking', 'ready', 'served'] as const) {
            await act(async () => {
                await result.current.setStatus(id, s);
            });
            expect(result.current.data.find(o => o.id === id)?.status).toBe(s);
        }
    });

    it('markPaid() passe status=paid + stamp paidAt', async () => {
        const { result } = renderHook(() =>
            useSovereignOrders({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ items: [sampleItem()] });
            await result.current.markPaid(id);
        });

        const order = result.current.data.find(o => o.id === id);
        expect(order?.status).toBe('paid');
        expect(order?.paidAt).toBeDefined();
    });

    it('cancel() met status=cancelled', async () => {
        const { result } = renderHook(() =>
            useSovereignOrders({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ items: [sampleItem()] });
            await result.current.cancel(id);
        });

        expect(result.current.data.find(o => o.id === id)?.status).toBe('cancelled');
    });

    it('setItemStatus() met à jour une ligne précise', async () => {
        const { result } = renderHook(() =>
            useSovereignOrders({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                items: [sampleItem('Steak', 1), sampleItem('Frites', 1)],
            });
        });
        // Attendre que le re-render propage `data` avant l'update par ligne
        await waitFor(() => expect(result.current.data.find(o => o.id === id)).toBeDefined());

        await act(async () => {
            await result.current.setItemStatus(id, 'line_Steak_1', 'ready');
        });

        const order = result.current.data.find(o => o.id === id);
        expect(order?.items.find(i => i.id === 'line_Steak_1')?.status).toBe('ready');
        expect(order?.items.find(i => i.id === 'line_Frites_1')?.status).toBe('pending');
    });

    it('filtre par tableId ne retourne que les commandes de cette table', async () => {
        await mockAdapter.set(`tenants/${TENANT}/ops_flows/o1`, {
            id: 'o1', status: 'pending', tableId: 'tbl_A',
            items: [sampleItem()], type: 'order', consumptionMode: 'dine_in',
            createdAt: Date.now(), updatedAt: Date.now(), schemaVersion: 2,
        });
        await mockAdapter.set(`tenants/${TENANT}/ops_flows/o2`, {
            id: 'o2', status: 'pending', tableId: 'tbl_B',
            items: [sampleItem()], type: 'order', consumptionMode: 'dine_in',
            createdAt: Date.now(), updatedAt: Date.now(), schemaVersion: 2,
        });

        const { result } = renderHook(() =>
            useSovereignOrders({ tenantId: TENANT, tableId: 'tbl_A', autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data.map(o => o.id)).toEqual(['o1']);
    });
});
