import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignLoyalty } from '@/modules/commerce/hooks/useSovereignLoyalty';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_loyalty';
const SUBJECT = '11111111-1111-4111-8111-111111111111';

describe('useSovereignLoyalty — Adapter commerce (fidélité)', () => {
    let mockAdapter: MockAdapter;
    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('create() → bronze par défaut', async () => {
        const { result } = renderHook(() => useSovereignLoyalty({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ subjectId: SUBJECT });
        });
        expect(id).toMatch(/^loy_/);
        expect(result.current.data[0].tier).toBe('bronze');
        expect(result.current.data[0].points).toBe(0);
    });

    it('earn() ajoute aux points ET lifetimePoints', async () => {
        const { result } = renderHook(() => useSovereignLoyalty({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ subjectId: SUBJECT });
        });
        await waitFor(() => expect(result.current.data.find(a => a.id === id)).toBeDefined());
        await act(async () => {
            await result.current.earn(id, 100);
        });
        const a = result.current.data.find(x => x.id === id);
        expect(a?.points).toBe(100);
        expect(a?.lifetimePoints).toBe(100);
        expect(a?.lastEarnedAt).toBeDefined();
    });

    it('redeem() n\'affecte PAS lifetimePoints', async () => {
        const { result } = renderHook(() => useSovereignLoyalty({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ subjectId: SUBJECT, initialPoints: 500 });
        });
        await waitFor(() => expect(result.current.data.find(a => a.id === id)).toBeDefined());
        await act(async () => {
            await result.current.redeem(id, 200);
        });
        const a = result.current.data.find(x => x.id === id);
        expect(a?.points).toBe(300);
        expect(a?.lifetimePoints).toBe(500);
    });

    it('redeem() refuse si solde insuffisant', async () => {
        const { result } = renderHook(() => useSovereignLoyalty({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.create({ subjectId: SUBJECT, initialPoints: 50 });
        });
        await waitFor(() => expect(result.current.data.find(a => a.id === id)).toBeDefined());
        await expect(async () => {
            await act(async () => {
                await result.current.redeem(id, 100);
            });
        }).rejects.toThrow(/Solde insuffisant/);
    });

    it('earn/redeem refusent points <= 0', async () => {
        const { result } = renderHook(() => useSovereignLoyalty({ tenantId: TENANT, autoSync: false }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        let id = '';
        await act(async () => {
            id = await result.current.create({ subjectId: SUBJECT, initialPoints: 10 });
        });
        await waitFor(() => expect(result.current.data.find(a => a.id === id)).toBeDefined());

        await expect(async () => {
            await act(async () => { await result.current.earn(id, 0); });
        }).rejects.toThrow(/> 0/);
        await expect(async () => {
            await act(async () => { await result.current.redeem(id, -5); });
        }).rejects.toThrow(/> 0/);
    });
});
