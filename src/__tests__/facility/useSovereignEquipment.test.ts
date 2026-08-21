import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignEquipment } from '@/modules/facility/hooks/useSovereignEquipment';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_equipment';

describe('useSovereignEquipment — Adapter facility', () => {
    let mockAdapter: MockAdapter;
    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('n\'est pas bloqué par NF525', () => {
        expect(() =>
            renderHook(() => useSovereignEquipment({ tenantId: TENANT, autoSync: false })),
        ).not.toThrow();
    });

    it('create() → status OPERATIONAL + nextDue calculée', async () => {
        const { result } = renderHook(() => useSovereignEquipment({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                name: 'Frigo cave',
                category: 'REFRIGERATION' as never,
                brand: 'Metro',
                model: 'X-500',
                serialNumber: 'SN123',
            });
        });
        expect(id).toMatch(/^eq_/);
        expect(result.current.data[0].status).toBe('OPERATIONAL');
        expect(result.current.data[0].nextMaintenanceDueAt).toBeDefined();
    });

    it('setStatus(BROKEN) + stampMaintenance repasse en OPERATIONAL', async () => {
        const { result } = renderHook(() => useSovereignEquipment({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                name: 'Four',
                category: 'COOKING' as never,
                brand: 'B',
                model: 'M',
                serialNumber: 'SN',
            });
        });
        await waitFor(() => expect(result.current.data.find(e => e.id === id)).toBeDefined());

        await act(async () => { await result.current.setStatus(id, 'BROKEN'); });
        expect(result.current.data.find(e => e.id === id)?.status).toBe('BROKEN');

        await act(async () => { await result.current.stampMaintenance(id, 30); });
        const after = result.current.data.find(e => e.id === id);
        expect(after?.status).toBe('OPERATIONAL');
        expect(after?.lastMaintenanceAt).toBeDefined();
    });

    it('retire() met status=RETIRED', async () => {
        const { result } = renderHook(() => useSovereignEquipment({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                name: 'X', category: 'OTHER' as never, brand: 'B', model: 'M', serialNumber: 'S',
            });
            await result.current.retire(id);
        });
        expect(result.current.data.find(e => e.id === id)?.status).toBe('RETIRED');
    });

    it('location filter isole une pièce', async () => {
        await mockAdapter.set(`tenants/${TENANT}/equipmentAssets/a`, {
            id: 'a', tenantId: TENANT, name: 'Frigo cave', category: 'REFRIGERATION',
            brand: 'X', model: 'Y', serialNumber: 'S1', location: 'Cave',
            status: 'OPERATIONAL', maintenanceFrequencyDays: 90,
            nextMaintenanceDueAt: '', createdAt: '', updatedAt: '',
        });
        await mockAdapter.set(`tenants/${TENANT}/equipmentAssets/b`, {
            id: 'b', tenantId: TENANT, name: 'Four', category: 'COOKING',
            brand: 'X', model: 'Y', serialNumber: 'S2', location: 'Cuisine',
            status: 'OPERATIONAL', maintenanceFrequencyDays: 90,
            nextMaintenanceDueAt: '', createdAt: '', updatedAt: '',
        });

        const { result } = renderHook(() =>
            useSovereignEquipment({ tenantId: TENANT, location: 'Cave', autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data.map(e => e.id)).toEqual(['a']);
    });
});
