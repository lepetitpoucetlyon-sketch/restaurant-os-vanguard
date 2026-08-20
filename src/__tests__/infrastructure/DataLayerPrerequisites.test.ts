import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IDService } from '@/lib/id/IDService';
import { SchemaVersioning } from '@/domain/schemas/migration/schemaVersioning';
import { OutboxService } from '@/lib/offline/OutboxService';
import { db } from '@/lib/offline/offline-store';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

describe('Vague 4 — Prérequis Data Layer Unifié', () => {
    let mockAdapter: MockAdapter;

    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    describe('IDService', () => {
        it('génère des identifiants avec préfixe et timestamp extractible', () => {
            const id = IDService.generate('ord');
            expect(id.startsWith('ord_')).toBe(true);

            const ts = IDService.extractTimestamp(id);
            expect(ts).toBeTypeOf('number');
            expect(Math.abs(Date.now() - (ts || 0))).toBeLessThan(5000);
        });

        it('génère des eventId idempotents uniques', () => {
            const e1 = IDService.generateEventId('order.placed', 'ord-1');
            const e2 = IDService.generateEventId('order.placed', 'ord-1');
            expect(e1.startsWith('evt_order.placed-ord-1_')).toBe(true);
            expect(e1).not.toBe(e2);
        });
    });

    describe('SchemaVersioning', () => {
        it('migre un document v1 vers v2 à la volée', () => {
            const v1Doc = {
                id: 'prod-1',
                name: 'Café',
                priceInCents: 250, // Ancien schéma v1 en cents
            };

            const migrators = {
                1: (doc: any) => ({
                    ...doc,
                    priceInMicrounits: doc.priceInCents * 10_000,
                }),
            };

            const migrated = SchemaVersioning.migrate<any>(v1Doc, migrators, 2);
            expect(migrated._schemaVersion).toBe(2);
            expect(migrated.priceInMicrounits).toBe(2_500_000);
        });
    });

    describe('OutboxService', () => {
        it('enfile une mutation et la draine vers Nexus', async () => {
            await OutboxService.enqueue({
                action: 'SET',
                collection: 'tenants/resto-1/orders',
                targetId: 'ord-100',
                payload: { totalMu: 12_000_000, status: 'PAID' },
                priority: 1,
            });

            expect(await OutboxService.getPendingCount()).toBe(1);

            const drainResult = await OutboxService.drain();
            expect(drainResult.processed).toBe(1);
            expect(drainResult.succeeded).toBe(1);
            expect(drainResult.remaining).toBe(0);

            const saved = await mockAdapter.get('tenants/resto-1/orders/ord-100');
            expect(saved).toBeDefined();
            expect((saved as any).totalMu).toBe(12_000_000);
        });
    });
});
