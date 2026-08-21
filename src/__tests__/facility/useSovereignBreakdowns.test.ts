import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignBreakdowns } from '@/modules/facility/hooks/useSovereignBreakdowns';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_brkdn';

describe('useSovereignBreakdowns — Adapter facility (incidents)', () => {
    let mockAdapter: MockAdapter;
    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('n\'est pas bloqué par NF525', () => {
        expect(() =>
            renderHook(() => useSovereignBreakdowns({ tenantId: TENANT, autoSync: false })),
        ).not.toThrow();
    });

    it('create() → status=OPEN, declaredAt stamp', async () => {
        const { result } = renderHook(() => useSovereignBreakdowns({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                equipmentId: 'eq_frigo',
                equipmentName: 'Frigo cave',
                severity: 'HIGH' as never,
                symptom: 'Ne refroidit plus',
                declaredBy: 'chef_paul',
            });
        });
        expect(id).toMatch(/^brk_/);
        expect(result.current.data[0].status).toBe('OPEN');
        expect(result.current.data[0].declaredAt).toBeDefined();
    });

    it('cycle startWork → resolve avec notes + cost + parts', async () => {
        const { result } = renderHook(() => useSovereignBreakdowns({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                equipmentId: 'eq_1', equipmentName: 'X',
                severity: 'LOW' as never, symptom: 'test', declaredBy: 'u',
            });
        });
        await waitFor(() => expect(result.current.data.find(b => b.id === id)).toBeDefined());

        await act(async () => { await result.current.startWork(id); });
        expect(result.current.data.find(b => b.id === id)?.status).toBe('IN_PROGRESS');

        await act(async () => {
            await result.current.resolve(id, 'Compresseur remplacé', 45_000_000, ['compresseur']);
        });
        const r = result.current.data.find(b => b.id === id);
        expect(r?.status).toBe('RESOLVED');
        expect(r?.resolvedAt).toBeDefined();
        expect(r?.resolutionNotes).toBe('Compresseur remplacé');
        expect(r?.costInMicrounits).toBe(45_000_000);
        expect(r?.partsReplaced).toEqual(['compresseur']);
    });

    it('setWaitingParts() met status=WAITING_PARTS', async () => {
        const { result } = renderHook(() => useSovereignBreakdowns({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({
                equipmentId: 'e', equipmentName: 'x', severity: 'LOW' as never,
                symptom: 's', declaredBy: 'u',
            });
            await result.current.setWaitingParts(id, ['piece1']);
        });
        expect(result.current.data.find(b => b.id === id)?.status).toBe('WAITING_PARTS');
    });

    it('equipmentId filter isole les tickets d\'un équipement', async () => {
        await mockAdapter.set(`tenants/${TENANT}/equipmentBreakdowns/a`, {
            id: 'a', tenantId: TENANT, equipmentId: 'eq_frigo', equipmentName: 'F',
            severity: 'HIGH', symptom: 'X', declaredBy: 'u',
            declaredAt: '', status: 'OPEN', partsReplaced: [],
        });
        await mockAdapter.set(`tenants/${TENANT}/equipmentBreakdowns/b`, {
            id: 'b', tenantId: TENANT, equipmentId: 'eq_four', equipmentName: 'F2',
            severity: 'LOW', symptom: 'Y', declaredBy: 'u',
            declaredAt: '', status: 'OPEN', partsReplaced: [],
        });

        const { result } = renderHook(() =>
            useSovereignBreakdowns({ tenantId: TENANT, equipmentId: 'eq_frigo', autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data.map(b => b.id)).toEqual(['a']);
    });
});
