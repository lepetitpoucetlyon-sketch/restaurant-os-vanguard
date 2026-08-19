import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock firebase-admin/firestore ---
const { docApi, collApi, batchApi, dbApi, mockGetFirestore, mockIncrement, mockServerTs } = vi.hoisted(() => {
  const docApi = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    id: 'generated-id',
  };
  const collApi = {
    where: vi.fn(() => collApi),
    orderBy: vi.fn(() => collApi),
    limit: vi.fn(() => collApi),
    get: vi.fn(),
    doc: vi.fn(() => docApi),
  };
  const batchApi = {
    set: vi.fn(), update: vi.fn(), delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  const dbApi = {
    doc: vi.fn(() => docApi),
    collection: vi.fn(() => collApi),
    batch: vi.fn(() => batchApi),
    runTransaction: vi.fn(),
  };
  return {
    docApi, collApi, batchApi, dbApi,
    mockGetFirestore: vi.fn(() => dbApi),
    mockIncrement: vi.fn((n: number) => ({ __increment: n })),
    mockServerTs: vi.fn(() => ({ __serverTs: true })),
  };
});

vi.mock('server-only', () => ({}));
vi.mock('firebase-admin/app', () => ({
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: mockGetFirestore,
  FieldValue: { increment: mockIncrement, serverTimestamp: mockServerTs },
}));

import { FirestoreServerAdapter } from './FirestoreServerAdapter';

const adapter = new FirestoreServerAdapter(dbApi as any);

describe('🛰️ FirestoreServerAdapter — traduction Admin SDK', () => {
  beforeEach(() => vi.clearAllMocks());

  it('get() lit le doc et fusionne id + data (null si absent)', async () => {
    docApi.get.mockResolvedValueOnce({ exists: true, id: 'x1', data: () => ({ name: 'A' }) });
    const r = await adapter.get('tenants/t1/orders/x1');
    expect(dbApi.doc).toHaveBeenCalledWith('tenants/t1/orders/x1');
    expect(r).toEqual({ id: 'x1', name: 'A' });

    docApi.get.mockResolvedValueOnce({ exists: false });
    expect(await adapter.get('tenants/t1/orders/none')).toBeNull();
  });

  it('set() applique merge quand demandé', async () => {
    await adapter.set('tenants/t1/config/main', { a: 1 }, { merge: true });
    expect(docApi.set).toHaveBeenCalledWith({ a: 1 }, { merge: true });
    await adapter.set('tenants/t1/config/main', { a: 2 });
    expect(docApi.set).toHaveBeenLastCalledWith({ a: 2 }, {});
  });

  it('query() chaîne where/orderBy/limit puis mappe les docs', async () => {
    collApi.get.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ v: 1 }) },
        { id: 'b', data: () => ({ v: 2 }) },
      ],
    });
    const rows = await adapter.query('tenants/t1/journalEntries', {
      where: [{ field: 'date', operator: '>=', value: '2026-01-01' }],
      orderBy: { field: 'date', direction: 'asc' },
      limit: 50,
    });
    expect(dbApi.collection).toHaveBeenCalledWith('tenants/t1/journalEntries');
    expect(collApi.where).toHaveBeenCalledWith('date', '>=', '2026-01-01');
    expect(collApi.orderBy).toHaveBeenCalledWith('date', 'asc');
    expect(collApi.limit).toHaveBeenCalledWith(50);
    expect(rows).toEqual([{ id: 'a', v: 1 }, { id: 'b', v: 2 }]);
  });

  it('increment() passe par FieldValue.increment', async () => {
    await adapter.increment('tenants/t1/counters/c', 'n', 3);
    expect(docApi.update).toHaveBeenCalled();
    const updateArg = docApi.update.mock.calls[0][0];
    expect(updateArg.n).toBeDefined();
  });

  it('generateId() renvoie un id de doc neuf', () => {
    expect(adapter.generateId('tenants/t1/orders')).toBe('generated-id');
  });

  it('runTransaction() expose un tx get/set/delete sur des doc refs', async () => {
    const txGet = vi.fn().mockResolvedValue({ exists: true, id: 'h', data: () => ({ hash: 'abc' }) });
    const txSet = vi.fn();
    dbApi.runTransaction.mockImplementationOnce(async (cb: (t: unknown) => Promise<unknown>) =>
      cb({ get: txGet, set: txSet, update: vi.fn(), delete: vi.fn() }),
    );
    const out = await adapter.runTransaction(async (tx) => {
      const head = await tx.get<{ hash: string }>('tenants/t1/fiscalMeta/chainHead');
      tx.set('tenants/t1/fiscalSeals/s1', { hash: 'new' });
      return head?.hash;
    });
    expect(out).toBe('abc');
    expect(txSet).toHaveBeenCalled();
  });

  it('onSnapshot() est refusé côté serveur', () => {
    expect(() => adapter.onSnapshot()).toThrow(/non supporté/);
  });
});
