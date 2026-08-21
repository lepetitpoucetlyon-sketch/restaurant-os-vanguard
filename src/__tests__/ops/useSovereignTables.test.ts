/**
 * useSovereignTables — Tests adapter pilier ops (plan de salle).
 * ADR-010 Phase 2.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignTables } from '@/modules/ops/hooks/useSovereignTables';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_tables';
const ZONE_A = '33333333-3333-4333-8333-333333333333';
const ZONE_B = '44444444-4444-4444-8444-444444444444';

describe('useSovereignTables — Adapter ops (plan de salle)', () => {
    let mockAdapter: MockAdapter;

    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('n\'est pas bloqué par NF525 (tables est mutable)', () => {
        expect(() =>
            renderHook(() => useSovereignTables({ tenantId: TENANT, autoSync: false })),
        ).not.toThrow();
    });

    it('create() ajoute une table free par défaut', async () => {
        const { result } = renderHook(() =>
            useSovereignTables({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                number: '12',
                seats: 4,
                x: 100, y: 200,
                zoneId: ZONE_A,
            });
        });

        expect(id).toMatch(/^tbl_/);
        expect(result.current.data[0].status).toBe('free');
        expect(result.current.data[0].seats).toBe(4);
    });

    it('setStatus() change le statut', async () => {
        const { result } = renderHook(() =>
            useSovereignTables({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ number: '1', seats: 2, x: 0, y: 0, zoneId: ZONE_A });
            await result.current.occupy(id);
        });
        expect(result.current.data.find(t => t.id === id)?.status).toBe('occupied');

        await act(async () => {
            await result.current.setCleaning(id);
        });
        expect(result.current.data.find(t => t.id === id)?.status).toBe('cleaning');

        await act(async () => {
            await result.current.free(id);
        });
        expect(result.current.data.find(t => t.id === id)?.status).toBe('free');
    });

    it('updatePosition() bouge les coordonnées', async () => {
        const { result } = renderHook(() =>
            useSovereignTables({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ number: '1', seats: 2, x: 0, y: 0, zoneId: ZONE_A });
            await result.current.updatePosition(id, 500, 300);
        });

        const t = result.current.data.find(t => t.id === id);
        expect(t?.x).toBe(500);
        expect(t?.y).toBe(300);
    });

    it('updateSeats() refuse < 1', async () => {
        const { result } = renderHook(() =>
            useSovereignTables({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ number: '1', seats: 2, x: 0, y: 0, zoneId: ZONE_A });
        });

        await expect(async () => {
            await act(async () => {
                await result.current.updateSeats(id, 0);
            });
        }).rejects.toThrow(/>= 1/);
    });

    it('zoneId filter isole les zones', async () => {
        await mockAdapter.set(`tenants/${TENANT}/tables/tA`, {
            id: 'tA', type: 'table', number: '1', seats: 2, status: 'free',
            x: 0, y: 0, zoneId: ZONE_A, shape: 'rect', schemaVersion: 2, updatedAt: Date.now(),
        });
        await mockAdapter.set(`tenants/${TENANT}/tables/tB`, {
            id: 'tB', type: 'table', number: '2', seats: 4, status: 'free',
            x: 0, y: 0, zoneId: ZONE_B, shape: 'rect', schemaVersion: 2, updatedAt: Date.now(),
        });

        const { result } = renderHook(() =>
            useSovereignTables({ tenantId: TENANT, zoneId: ZONE_A, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data.map(t => t.id)).toEqual(['tA']);
    });
});
