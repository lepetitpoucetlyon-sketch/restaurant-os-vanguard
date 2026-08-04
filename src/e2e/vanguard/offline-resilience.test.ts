import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SyncOperation } from '@/infrastructure/services/offline/offline-store';

/**
 * 🔌 Résilience offline — « coupure réseau en plein service ».
 *
 * Contrat testé (SyncManager) :
 *  1. Un ticket NF525 mis en file hors-ligne n'est PAS perdu.
 *  2. Au retour du réseau, la file est rejouée et vidée.
 *  3. Une op qui a échoué ('failed') est RETENTÉE au cycle suivant
 *     (avant correctif : les 'failed' n'étaient jamais rejoués).
 *  4. Le fiscal (priority 1) est rejoué AVANT le reste
 *     (avant correctif : tri croissant → fiscal en dernier).
 */

// --- Fausse file Dexie en mémoire (fonctionnelle, contrairement au mock global) ---
let queue: (SyncOperation & { id: number })[] = [];
let nextId = 1;

vi.mock('@/infrastructure/services/offline/offline-store', () => ({
    db: {
        syncQueue: {
            add: vi.fn(async (op: SyncOperation) => { const id = nextId++; queue.push({ ...op, id }); return id; }),
            delete: vi.fn(async (id: number) => { queue = queue.filter(o => o.id !== id); }),
            update: vi.fn(async (id: number, patch: Partial<SyncOperation>) => {
                const op = queue.find(o => o.id === id);
                if (op) Object.assign(op, patch);
            }),
            where: vi.fn((_field: string) => ({
                anyOf: (...statuses: string[]) => ({
                    toArray: async () => queue.filter(o => statuses.flat().includes(o.status)),
                }),
                equals: (status: string) => ({
                    count: async () => queue.filter(o => o.status === status).length,
                }),
            })),
        },
    },
}));

// --- Connectivité contrôlable ---
let online = true;
vi.mock('@/infrastructure/services/offline/connectivity-hooks', () => ({
    checkOnlineStatus: () => online,
}));

// --- Adapter Nexus contrôlable (réseau coupé = throw) ---
const executed: string[] = [];
let networkDown = false;
vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            batch: () => ({
                set: vi.fn(), update: vi.fn(), delete: vi.fn(),
                commit: vi.fn(async () => {
                    if (networkDown) throw new Error('NETWORK_UNAVAILABLE');
                    executed.push('BATCH_COMMIT');
                }),
            }),
            get: vi.fn(async () => null),
            set: vi.fn(async (path: string) => {
                if (networkDown) throw new Error('NETWORK_UNAVAILABLE');
                executed.push(`SET:${path}`);
            }),
            update: vi.fn(async (path: string) => {
                if (networkDown) throw new Error('NETWORK_UNAVAILABLE');
                executed.push(`UPDATE:${path}`);
            }),
        },
    },
}));

import { SyncManager } from '@/infrastructure/services/offline/sync-manager';

function fiscalOp(orderId: string): Omit<SyncOperation, 'status' | 'attempts' | 'timestamp'> {
    return {
        type: 'NF525_PAYMENT',
        action: 'COMMIT_BATCH',
        collection: 'orders',
        targetId: orderId,
        payload: { instructions: [{ method: 'SET', path: `tenants/t1/journalEntries/${orderId}`, data: { id: orderId } }] },
        priority: 1,
    };
}

function stockOp(id: string): Omit<SyncOperation, 'status' | 'attempts' | 'timestamp'> {
    return { type: 'STOCK_UPDATE', action: 'SET', collection: 'tenants/t1/stockItems', targetId: id, payload: { id }, priority: 0 };
}

describe('🔌 Résilience offline — SyncManager', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        queue = [];
        nextId = 1;
        executed.length = 0;
        online = true;
        networkDown = false;
        
        global.fetch = vi.fn().mockImplementation(async (url) => {
            if (networkDown) {
                return { ok: false, status: 503, statusText: 'Service Unavailable' };
            }
            if (url === '/api/finance/sync') {
                executed.push('FETCH_API_SYNC');
                return { ok: true, json: async () => ({ success: true }) };
            }
            return { ok: true };
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('un ticket NF525 enfilé hors-ligne reste en file (zéro perte)', async () => {
        online = false;
        await SyncManager.enqueue(fiscalOp('order-1'));
        expect(queue).toHaveLength(1);
        expect(queue[0].status).toBe('pending');
        expect(executed).toHaveLength(0); // rien ne part tant que le réseau est coupé
    });

    it('au retour du réseau, la file est rejouée puis vidée', async () => {
        online = false;
        await SyncManager.enqueue(fiscalOp('order-1'));
        await SyncManager.enqueue(stockOp('stock-1'));

        online = true; // le service se reconnecte
        await SyncManager.processQueue();

        expect(executed).toContain('FETCH_API_SYNC');
        expect(executed).toContain('SET:tenants/t1/stockItems/stock-1');
        expect(queue).toHaveLength(0);
    });

    it("une op 'failed' est retentée au cycle suivant (pas d'abandon)", async () => {
        online = false;
        await SyncManager.enqueue(fiscalOp('order-2')); // reste 'pending', aucun trigger

        online = true;
        networkDown = true; // en ligne mais le backend rejette (réseau instable)
        await SyncManager.processQueue();
        expect(queue[0]?.status).toBe('failed');
        expect(queue[0]?.attempts).toBe(1);

        networkDown = false; // backend de retour
        await SyncManager.processQueue();
        expect(executed).toContain('FETCH_API_SYNC');
        expect(queue).toHaveLength(0);
    });

    it('le fiscal (priority 1) est rejoué avant le stock (priority 0)', async () => {
        online = false;
        await SyncManager.enqueue(stockOp('stock-1'));   // enfilé AVANT…
        await SyncManager.enqueue(fiscalOp('order-3'));  // …mais priorité inférieure

        online = true;
        await SyncManager.processQueue();

        expect(executed.indexOf('BATCH_COMMIT')).toBeLessThan(
            executed.indexOf('SET:tenants/t1/stockItems/stock-1')
        );
    });
});
