/**
 * useSovereignReservations — Tests adapter pilier ops (booking).
 * ADR-010 Phase 2.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignReservations } from '@/modules/ops/hooks/useSovereignReservations';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_reservations';

describe('useSovereignReservations — Adapter ops (booking)', () => {
    let mockAdapter: MockAdapter;

    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('n\'est pas bloqué par NF525 (reservations est mutable)', () => {
        expect(() =>
            renderHook(() => useSovereignReservations({ tenantId: TENANT, autoSync: false })),
        ).not.toThrow();
    });

    it('create() ajoute une réservation pending avec ID généré', async () => {
        const { result } = renderHook(() =>
            useSovereignReservations({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                customerName: 'Marie Dupont',
                phone: '+33612345678',
                date: '2026-09-01',
                time: '20:00',
                covers: 4,
            });
        });

        expect(id).toMatch(/^rsv_/);
        expect(result.current.data[0].status).toBe('pending');
        expect(result.current.data[0].covers).toBe(4);
        expect(result.current.data[0].duration).toBe(90); // default
    });

    it('cycle : confirm → seat → complete', async () => {
        const { result } = renderHook(() =>
            useSovereignReservations({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                customerName: 'Paul Martin', phone: '+33611111111',
                date: '2026-09-01', time: '19:30', covers: 2,
            });
            await result.current.confirm(id);
        });
        expect(result.current.data.find(r => r.id === id)?.status).toBe('confirmed');

        await act(async () => {
            await result.current.seat(id, 'tbl_5');
        });
        const seated = result.current.data.find(r => r.id === id);
        expect(seated?.status).toBe('seated');
        expect(seated?.tableId).toBe('tbl_5');

        await act(async () => {
            await result.current.complete(id);
        });
        expect(result.current.data.find(r => r.id === id)?.status).toBe('completed');
    });

    it('cancel() et noShow() posent le bon statut', async () => {
        const { result } = renderHook(() =>
            useSovereignReservations({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let idCancel = '', idNoShow = '';
        await act(async () => {
            idCancel = await result.current.create({
                customerName: 'A', phone: '+3300', date: '2026-09-01', time: '19:00', covers: 1,
            });
            idNoShow = await result.current.create({
                customerName: 'B', phone: '+3311', date: '2026-09-01', time: '19:30', covers: 2,
            });
            await result.current.cancel(idCancel);
            await result.current.noShow(idNoShow);
        });

        expect(result.current.data.find(r => r.id === idCancel)?.status).toBe('cancelled');
        expect(result.current.data.find(r => r.id === idNoShow)?.status).toBe('no-show');
    });

    it('assignTable() met à jour la table sans changer status', async () => {
        const { result } = renderHook(() =>
            useSovereignReservations({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                customerName: 'X', phone: '+3312', date: '2026-09-01', time: '20:00', covers: 3,
            });
            await result.current.confirm(id);
            await result.current.assignTable(id, 'tbl_9');
        });

        const r = result.current.data.find(r => r.id === id);
        expect(r?.tableId).toBe('tbl_9');
        expect(r?.status).toBe('confirmed'); // inchangé
    });

    it('dateFilter isole une seule journée', async () => {
        await mockAdapter.set(`tenants/${TENANT}/reservations/r1`, {
            id: 'r1', crmName: 'X', customerName: 'X', phone: '+330', tableId: '',
            date: '2026-09-01', time: '19:00', covers: 2, status: 'pending', tags: [],
            duration: 90, createdAt: '', updatedAt: '',
        });
        await mockAdapter.set(`tenants/${TENANT}/reservations/r2`, {
            id: 'r2', crmName: 'Y', customerName: 'Y', phone: '+331', tableId: '',
            date: '2026-09-02', time: '19:00', covers: 3, status: 'pending', tags: [],
            duration: 90, createdAt: '', updatedAt: '',
        });

        const { result } = renderHook(() =>
            useSovereignReservations({ tenantId: TENANT, dateFilter: '2026-09-01', autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data.map(r => r.id)).toEqual(['r1']);
    });
});
