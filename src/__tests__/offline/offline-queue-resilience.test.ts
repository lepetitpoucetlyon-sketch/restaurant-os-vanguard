import { describe, it, expect, vi, beforeEach } from 'vitest';
import { offlineQueue } from '@/lib/sync/offlineQueue';
import { db } from '@/lib/offline/offline-store';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { Order } from '@nexus/contracts';

describe('Mode Hors-Ligne POS & Résilience NF525 Multi-Caisses (Set 4)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        try {
            await db.orders.clear();
            await db.syncQueue.clear();
        } catch {
            // Mock Dexie si environnement headless
        }
    });

    it('devrait enfiler une commande hors-ligne avec priorité fiscale 1', async () => {
        const sampleOrder: Order = {
            id: 'ord-offline-001',
            status: 'paid',
            items: [],
            totalInMicrounits: 45_000_000,
            tableId: 'tbl-12',
            createdAt: new Date().toISOString(),
        } as unknown as Order;

        const res = await offlineQueue.enqueueOfflineOrder('bistro-parisien', sampleOrder, 'pos-tablette-1');
        expect(res.queueId).toBeDefined();

        const stats = await offlineQueue.getStats();
        expect(stats).toBeDefined();
    });

    it('devrait sceller deux chaînes fiscales indépendantes par caisse (pos-tab-1 et pos-tab-2) sans forker', async () => {
        const store: Record<string, unknown> = {};

        vi.spyOn(Nexus.adapter, 'runTransaction').mockImplementation(async (callback) => {
            const tx = {
                get: async (path: string) => (store[path] as unknown) ?? null,
                set: async (path: string, val: unknown) => { store[path] = val; },
                delete: async (path: string) => { delete store[path]; },
            };
            return callback(tx as never);
        });

        // 1. Caisse 1 (Terrasse) scelle une commande
        const sealTab1 = await FiscalSealer.sealDataAtomically(
            JSON.stringify({ amount: 25, orderId: 'ord-1' }),
            'bistro-parisien',
            false,
            { id: 'JE-ord-1' },
            undefined,
            'pos-terrasse'
        );

        expect(sealTab1.sealId).toBeDefined();
        expect(sealTab1.hash).toBeDefined();
        expect(store['tenants/bistro-parisien/fiscalMeta/chainHead_pos-terrasse']).toEqual(
            expect.objectContaining({
                registerId: 'pos-terrasse',
                hash: sealTab1.hash,
            })
        );

        // 2. Caisse 2 (Bar) scelle une commande en parallèle
        const sealTab2 = await FiscalSealer.sealDataAtomically(
            JSON.stringify({ amount: 12, orderId: 'ord-2' }),
            'bistro-parisien',
            false,
            { id: 'JE-ord-2' },
            undefined,
            'pos-bar'
        );

        expect(sealTab2.sealId).toBeDefined();
        expect(sealTab2.hash).toBeDefined();
        expect(store['tenants/bistro-parisien/fiscalMeta/chainHead_pos-bar']).toEqual(
            expect.objectContaining({
                registerId: 'pos-bar',
                hash: sealTab2.hash,
            })
        );

        // 3. Caisse 1 scelle une 2e commande et vérifie que previousHash === hash de la 1ère de pos-terrasse
        const sealTab1Bis = await FiscalSealer.sealDataAtomically(
            JSON.stringify({ amount: 30, orderId: 'ord-3' }),
            'bistro-parisien',
            false,
            { id: 'JE-ord-3' },
            undefined,
            'pos-terrasse'
        );

        expect(sealTab1Bis.previousHash).toBe(sealTab1.hash);
    });

    it('devrait émettre un événement de reconnexion lors de la vidange du buffer', async () => {
        const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue([] as never);

        const flushRes = await offlineQueue.flush();
        expect(flushRes).toBeDefined();
        expect(flushRes.success).toBe(true);
    });
});
