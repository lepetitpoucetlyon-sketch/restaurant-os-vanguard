import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';
import { OutboxService } from '@/lib/offline/OutboxService';

describe('useSovereignCollection — Hook Universel Data Layer', () => {
    let mockAdapter: MockAdapter;

    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 🛡️ GARDE-FOU NF525
    // ══════════════════════════════════════════════════════════════════════════

    describe('Garde-fou NF525', () => {
        it('bloque journalEntries', () => {
            expect(() =>
                renderHook(() => useSovereignCollection('journalEntries', { tenantId: 'test' })),
            ).toThrow(/VIOLATION NF525/);
        });

        it('bloque fiscalSeals', () => {
            expect(() =>
                renderHook(() => useSovereignCollection('fiscalSeals', { tenantId: 'test' })),
            ).toThrow(/VIOLATION NF525/);
        });

        it('bloque wormArchives, fiscalLedger, auditTrails et haccpLogs', () => {
            for (const col of ['wormArchives', 'fiscalLedger', 'auditTrails', 'haccpLogs']) {
                expect(() =>
                    renderHook(() => useSovereignCollection(col, { tenantId: 'test' })),
                ).toThrow(/VIOLATION NF525/);
            }
        });

        it('autorise les collections mutables (reservations, orders, products)', () => {
            for (const col of ['reservations', 'orders', 'products']) {
                expect(() =>
                    renderHook(() => useSovereignCollection(col, { tenantId: 'test' })),
                ).not.toThrow();
            }
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 📥 LECTURE & FILTRAGE
    // ══════════════════════════════════════════════════════════════════════════

    describe('Lecture & filtrage', () => {
        it('charge les données depuis Nexus au montage', async () => {
            await mockAdapter.set('tenants/test/reservations/r1', { id: 'r1', seats: 4 });
            await mockAdapter.set('tenants/test/reservations/r2', { id: 'r2', seats: 2 });

            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string; seats: number }>('reservations', { tenantId: 'test' }),
            );

            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.data).toHaveLength(2);
        });

        it('applique l’option filter', async () => {
            await mockAdapter.set('tenants/test/reservations/r1', { id: 'r1', seats: 4, vip: true });
            await mockAdapter.set('tenants/test/reservations/r2', { id: 'r2', seats: 2, vip: false });

            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string; seats: number; vip: boolean }>('reservations', {
                    tenantId: 'test',
                    filter: (r) => r.vip === true,
                }),
            );

            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.data).toHaveLength(1);
            expect(result.current.data[0].id).toBe('r1');
        });

        it('utilise tenantId personnalisé dans le path', async () => {
            const spy = vi.spyOn(mockAdapter, 'query');
            renderHook(() => useSovereignCollection('reservations', { tenantId: 'other-tenant' }));
            await waitFor(() => {
                expect(spy).toHaveBeenCalled();
                expect(spy.mock.calls[0][0]).toBe('tenants/other-tenant/reservations');
            });
        });

        it('remplit error si Nexus.query throw', async () => {
            vi.spyOn(mockAdapter, 'query').mockRejectedValueOnce(new Error('boom'));
            const { result } = renderHook(() =>
                useSovereignCollection('reservations', { tenantId: 'test' }),
            );
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.error).toBe('boom');
        });

        it('refresh() recharge depuis Nexus', async () => {
            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string; seats: number }>('reservations', { tenantId: 'test' }),
            );
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.data).toHaveLength(0);

            await mockAdapter.set('tenants/test/reservations/r-new', { id: 'r-new', seats: 5 });
            await act(async () => {
                await result.current.refresh();
            });
            expect(result.current.data).toHaveLength(1);
            expect(result.current.data[0].id).toBe('r-new');
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // ✏️ ÉCRITURES OPTIMISTES + OUTBOX
    // ══════════════════════════════════════════════════════════════════════════

    describe('Écritures optimistes + Outbox', () => {
        it('set() met à jour data localement immédiatement (0 ms) et enfile dans Outbox', async () => {
            const enqueueSpy = vi.spyOn(OutboxService, 'enqueue');
            const drainSpy = vi.spyOn(OutboxService, 'drain').mockResolvedValue({
                processed: 0, succeeded: 0, failed: 0, remaining: 0,
            });

            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string; label: string }>('reservations', { tenantId: 'test' }),
            );
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.set({ id: 'r-1', label: 'nouveau' });
            });

            expect(result.current.data).toContainEqual({ id: 'r-1', label: 'nouveau' });
            expect(enqueueSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'SET',
                    collection: 'tenants/test/reservations',
                    targetId: 'r-1',
                }),
            );
            expect(drainSpy).toHaveBeenCalled();
        });

        it('génère un id si item.id est absent (via IDService)', async () => {
            vi.spyOn(OutboxService, 'drain').mockResolvedValue({
                processed: 0, succeeded: 0, failed: 0, remaining: 0,
            });
            const enqueueSpy = vi.spyOn(OutboxService, 'enqueue');

            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string; label: string }>('reservations', { tenantId: 'test' }),
            );
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                // Cast pour simuler item sans id explicite (comportement métier légitime)
                await result.current.set({ id: '', label: 'auto-id' } as { id: string; label: string });
            });

            const call = enqueueSpy.mock.calls[0][0];
            expect(call.targetId).toMatch(/^rese_/); // prefix = collectionName.slice(0, 4)
            expect(call.targetId.length).toBeGreaterThan(10);
        });

        it('update() applique le patch partiel localement et enfile UPDATE', async () => {
            await mockAdapter.set('tenants/test/reservations/r1', { id: 'r1', seats: 2, label: 'ok' });
            vi.spyOn(OutboxService, 'drain').mockResolvedValue({
                processed: 0, succeeded: 0, failed: 0, remaining: 0,
            });
            const enqueueSpy = vi.spyOn(OutboxService, 'enqueue');

            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string; seats: number; label: string }>('reservations', {
                    tenantId: 'test',
                }),
            );
            await waitFor(() => expect(result.current.data).toHaveLength(1));

            await act(async () => {
                await result.current.update('r1', { seats: 8 });
            });

            expect(result.current.data[0]).toEqual({ id: 'r1', seats: 8, label: 'ok' });
            expect(enqueueSpy).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'UPDATE', targetId: 'r1' }),
            );
        });

        it('delete() retire l’item localement et enfile DELETE', async () => {
            await mockAdapter.set('tenants/test/reservations/r1', { id: 'r1' });
            await mockAdapter.set('tenants/test/reservations/r2', { id: 'r2' });
            vi.spyOn(OutboxService, 'drain').mockResolvedValue({
                processed: 0, succeeded: 0, failed: 0, remaining: 0,
            });
            const enqueueSpy = vi.spyOn(OutboxService, 'enqueue');

            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string }>('reservations', { tenantId: 'test' }),
            );
            await waitFor(() => expect(result.current.data).toHaveLength(2));

            await act(async () => {
                await result.current.delete('r1');
            });

            expect(result.current.data).toEqual([{ id: 'r2' }]);
            expect(enqueueSpy).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'DELETE', targetId: 'r1' }),
            );
        });

        it('autoSync: false n’invoque PAS drain', async () => {
            const drainSpy = vi.spyOn(OutboxService, 'drain');
            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string }>('reservations', {
                    tenantId: 'test',
                    autoSync: false,
                }),
            );
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.set({ id: 'r-1' });
            });

            expect(drainSpy).not.toHaveBeenCalled();
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 🔄 ÉTAT isSyncing
    // ══════════════════════════════════════════════════════════════════════════

    describe('État isSyncing', () => {
        it('bascule isSyncing pendant drain puis revient à false', async () => {
            let resolveDrain: (v: { processed: number; succeeded: number; failed: number; remaining: number }) => void;
            const drainPromise = new Promise<{ processed: number; succeeded: number; failed: number; remaining: number }>((r) => {
                resolveDrain = r;
            });
            vi.spyOn(OutboxService, 'drain').mockReturnValueOnce(drainPromise);

            const { result } = renderHook(() =>
                useSovereignCollection<{ id: string }>('reservations', { tenantId: 'test' }),
            );
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.set({ id: 'r-1' });
            });

            expect(result.current.isSyncing).toBe(true);

            await act(async () => {
                resolveDrain!({ processed: 1, succeeded: 1, failed: 0, remaining: 0 });
                await drainPromise;
            });

            await waitFor(() => expect(result.current.isSyncing).toBe(false));
        });
    });
});
