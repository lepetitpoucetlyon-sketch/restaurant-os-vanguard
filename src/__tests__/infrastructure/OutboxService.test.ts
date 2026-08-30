import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutboxService } from '@/lib/offline/OutboxService';
import { db } from '@/lib/offline/offline-store';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';

// Suite dédiée OutboxService — couvre enqueue / drain / priorités / retry / DLQ / alertes.
// Provider-agnostique (via MockAdapter câblé dans Nexus.adapter).

describe('OutboxService', () => {
    let mockAdapter: MockAdapter;

    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 📥 ENQUEUE
    // ══════════════════════════════════════════════════════════════════════════

    describe('enqueue()', () => {
        it('enfile une opération avec status pending et timestamp', async () => {
            const id = await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/ops_flows',
                targetId: 'o1',
                payload: { total: 100 },
            });

            expect(id).toBeGreaterThan(0);
            const rows = await db.syncQueue.toArray();
            expect(rows).toHaveLength(1);
            expect(rows[0].status).toBe('pending');
            expect(rows[0].timestamp).toMatch(/^\d{4}-/);
            expect(rows[0].attempts).toBe(0);
        });

        it('assigne priorité 1 automatiquement si le path contient "fiscal"', async () => {
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/fiscalArchives',
                targetId: 'f1',
                payload: {},
            });
            const [row] = await db.syncQueue.toArray();
            expect(row.priority).toBe(1);
        });

        it('assigne priorité 1 automatiquement si le path contient "journal"', async () => {
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/journalDraft',
                targetId: 'j1',
                payload: {},
            });
            const [row] = await db.syncQueue.toArray();
            expect(row.priority).toBe(1);
        });

        it('assigne priorité 0 par défaut aux collections standards', async () => {
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/reservations',
                targetId: 'r1',
                payload: {},
            });
            const [row] = await db.syncQueue.toArray();
            expect(row.priority).toBe(0);
        });

        it('propage un eventId explicite dans payload._eventId (idempotence)', async () => {
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/ops_flows',
                targetId: 'o1',
                payload: { total: 100 },
                eventId: 'evt-custom-123',
            });
            const [row] = await db.syncQueue.toArray();
            expect((row.payload as Record<string, unknown>)._eventId).toBe('evt-custom-123');
        });

        it('génère un eventId auto si absent', async () => {
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/ops_flows',
                targetId: 'o1',
                payload: { total: 100 },
            });
            const [row] = await db.syncQueue.toArray();
            const evt = (row.payload as Record<string, unknown>)._eventId as string;
            expect(evt).toMatch(/^evt_/);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 🔄 DRAIN — cas nominaux
    // ══════════════════════════════════════════════════════════════════════════

    describe('drain() — cas nominaux', () => {
        it('drain sur queue vide → processed:0, succeeded:0', async () => {
            const res = await OutboxService.drain();
            expect(res).toEqual({ processed: 0, succeeded: 0, failed: 0, remaining: 0 });
        });

        it('drain SET → écrit dans le storage cible et supprime l’entrée', async () => {
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/ops_flows',
                targetId: 'o1',
                payload: { total: 100 },
            });
            const res = await OutboxService.drain();
            expect(res.succeeded).toBe(1);
            expect(res.remaining).toBe(0);

            // Vérif par résultat : le doc est visible via Nexus (path scopé par tenant)
            const stored = (await Nexus.adapter.get('tenants/t1/ops_flows/o1')) as Record<string, unknown> | null;
            expect(stored).toBeTruthy();
            expect(stored?.total).toBe(100);
            expect(await db.syncQueue.count()).toBe(0);
        });

        it('drain DELETE → retire le doc du storage', async () => {
            // Semer un doc préalable
            await Nexus.adapter.set('tenants/t1/ops_flows/o1', { id: 'o1', total: 100 });
            expect(await Nexus.adapter.get('tenants/t1/ops_flows/o1')).toBeTruthy();

            await OutboxService.enqueue({
                action: 'DELETE',
                collection: 'tenants/t1/ops_flows',
                targetId: 'o1',
                payload: { id: 'o1' },
            });
            const res = await OutboxService.drain();
            expect(res.succeeded).toBe(1);
            expect(await Nexus.adapter.get('tenants/t1/ops_flows/o1')).toBeNull();
        });

        it('drain traite les entrées priority=1 AVANT priority=0', async () => {
            const drainOrder: string[] = [];
            vi.spyOn(mockAdapter, 'set').mockImplementation(async (path) => {
                drainOrder.push(String(path));
            });

            // Enfilé dans le désordre : normal d'abord, fiscal ensuite
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/reservations',
                targetId: 'r1',
                payload: { seats: 4 },
            });
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/fiscalArchives',
                targetId: 'f1',
                payload: { amount: 100 },
            });
            await OutboxService.drain();
            // Le fiscal doit être traité en premier (priority 1 > 0)
            expect(drainOrder[0]).toContain('fiscalArchives');
            expect(drainOrder[1]).toContain('reservations');
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // ❌ DRAIN — retry & DLQ
    // ══════════════════════════════════════════════════════════════════════════

    describe('drain() — retry & DLQ', () => {
        it('incrémente attempts si Nexus throw, ne supprime pas l’entrée', async () => {
            vi.spyOn(mockAdapter, 'set').mockRejectedValue(new Error('net down'));
            const id = await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/reservations',
                targetId: 'r1',
                payload: {},
            });
            const res = await OutboxService.drain();
            expect(res.failed).toBe(1);
            expect(res.remaining).toBe(1);
            const row = await db.syncQueue.get(id);
            expect(row?.attempts).toBe(1);
            expect(row?.status).toBe('pending');
            expect(row?.lastError).toBe('net down');
        });

        it('après 5 tentatives → status "failed" (bascule DLQ)', async () => {
            vi.spyOn(mockAdapter, 'set').mockRejectedValue(new Error('net down'));
            const id = await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/reservations',
                targetId: 'r1',
                payload: {},
            });
            for (let i = 0; i < 5; i++) {
                await OutboxService.drain();
            }
            const row = await db.syncQueue.get(id);
            expect(row?.status).toBe('failed');
            expect(row?.attempts).toBe(5);
        });

        it('après 5 tentatives sur op FISCALE → OpsAlertGateway CRITICAL', async () => {
            vi.spyOn(mockAdapter, 'set').mockRejectedValue(new Error('sync failed'));
            const alertSpy = vi.spyOn(OpsAlertGateway, 'send').mockResolvedValue(true);

            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/fiscalArchives',
                targetId: 'f1',
                payload: {},
                priority: 1,
            });
            for (let i = 0; i < 5; i++) {
                await OutboxService.drain();
            }

            expect(alertSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'critical',
                    source: 'outbox-service',
                    title: expect.stringContaining('DLQ Outbox'),
                }),
            );
        });

        it('après 5 tentatives sur op NON-FISCALE → PAS d’OpsAlertGateway', async () => {
            vi.spyOn(mockAdapter, 'set').mockRejectedValue(new Error('sync failed'));
            const alertSpy = vi.spyOn(OpsAlertGateway, 'send').mockResolvedValue(true);

            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/reservations',
                targetId: 'r1',
                payload: {},
            });
            for (let i = 0; i < 5; i++) {
                await OutboxService.drain();
            }

            expect(alertSpy).not.toHaveBeenCalled();
        });

        it('drain mixte succès + échec → 2 succeeded, 1 failed', async () => {
            const setSpy = vi.spyOn(mockAdapter, 'set');
            setSpy
                .mockResolvedValueOnce(undefined) // ok
                .mockRejectedValueOnce(new Error('boom')) // fail
                .mockResolvedValueOnce(undefined); // ok

            await OutboxService.enqueue({ action: 'SET', collection: 'tenants/t1/a', targetId: '1', payload: {} });
            await OutboxService.enqueue({ action: 'SET', collection: 'tenants/t1/b', targetId: '2', payload: {} });
            await OutboxService.enqueue({ action: 'SET', collection: 'tenants/t1/c', targetId: '3', payload: {} });

            const res = await OutboxService.drain();
            expect(res.processed).toBe(3);
            expect(res.succeeded).toBe(2);
            expect(res.failed).toBe(1);
            expect(res.remaining).toBe(1); // le failed reste pending
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 🔢 getPendingCount
    // ══════════════════════════════════════════════════════════════════════════

    describe('getPendingCount()', () => {
        it('reflète le nombre d’entrées pending', async () => {
            expect(await OutboxService.getPendingCount()).toBe(0);
            await OutboxService.enqueue({ action: 'SET', collection: 'tenants/t1/a', targetId: '1', payload: {} });
            await OutboxService.enqueue({ action: 'SET', collection: 'tenants/t1/b', targetId: '2', payload: {} });
            expect(await OutboxService.getPendingCount()).toBe(2);
        });

        it('les entrées "failed" sortent bien du flux pending après 5 échecs', async () => {
            vi.spyOn(mockAdapter, 'set').mockRejectedValue(new Error('boom'));
            const id = await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/t1/reservations',
                targetId: 'r1',
                payload: {},
            });
            for (let i = 0; i < 5; i++) await OutboxService.drain();

            // Vérif : le doc est bien marqué failed dans la base
            const row = await db.syncQueue.get(id);
            expect(row?.status).toBe('failed');
            expect(row?.attempts).toBe(5);
            // Total en base = 1 (conservé pour audit / DLQ inspection)
            expect(await db.syncQueue.count()).toBe(1);
        });
    });
});
