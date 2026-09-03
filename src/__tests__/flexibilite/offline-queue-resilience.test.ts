import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/offline/offline-store';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { registerTicketZHandler } from '@/shared/eventBus/handlers/TicketZHandler';
import { registerOrderCancelRestockHandler } from '@/shared/eventBus/handlers/OrderCancelRestockHandler';

describe('Lot 0 — Résilience de file hors-ligne & Idempotence', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    NexusEventBus.resetForTesting();
    IdempotencyGuard.clearMemoryCache();
    try {
      await db.dangerouslyClearSyncQueue();
      await db.clearReadCaches();
    } catch {
      // headless mock fallback
    }
  });

  it('F5: clearAll() et clearReadCaches() ne vident JAMAIS la syncQueue', async () => {
    // 1. Enfiler une opération dans syncQueue
    await db.syncQueue.add({
      type: 'NF525_PAYMENT',
      action: 'SET',
      collection: 'journalEntries',
      targetId: 'JE-100',
      payload: { id: 'JE-100', amount: 50 },
      timestamp: new Date().toISOString(),
      status: 'pending',
      priority: 1,
      attempts: 0,
    });

    const countBefore = await db.syncQueue.count();
    expect(countBefore).toBe(1);

    // 2. Simuler un clearAll / navigation
    await db.clearAll();

    // 3. syncQueue doit être intacte !
    const countAfter = await db.syncQueue.count();
    expect(countAfter).toBe(1);

    // 4. Seul dangerouslyClearSyncQueue peut la vider en test
    await db.dangerouslyClearSyncQueue();
    expect(await db.syncQueue.count()).toBe(0);
  });

  it('IdempotencyGuard: extrait orderId lorsque eventId est absent et bloque le rejeu', async () => {
    const mockFn = vi.fn();
    const guarded = IdempotencyGuard.withIdempotencyGuard(
      'test-order-handler',
      'order.paid',
      mockFn
    );

    // 1ère exécution
    await guarded({ orderId: 'ord-12345', tenantId: 'tenant-test', totalInMicrounits: 20000000 });
    expect(mockFn).toHaveBeenCalledTimes(1);

    // 2ème exécution (rejeu avec le même orderId)
    await guarded({ orderId: 'ord-12345', tenantId: 'tenant-test', totalInMicrounits: 20000000 });
    expect(mockFn).toHaveBeenCalledTimes(1); // Doit être ignoré !
  });

  it('TicketZHandler: ne cumule pas deux fois la même commande dans le Ticket Z du jour', async () => {
    const store: Record<string, unknown> = {};

    vi.spyOn(Nexus.adapter, 'runTransaction').mockImplementation(async (callback) => {
      const tx = {
        get: async (path: string) => (store[path] as unknown) ?? null,
        set: async (path: string, val: unknown) => { store[path] = val; },
        update: async (path: string, val: unknown) => {
          store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(val as Record<string, unknown>) };
        },
        delete: async (path: string) => { delete store[path]; },
      };
      return callback(tx as never);
    });

    const unsub = registerTicketZHandler();

    // 1er envoi de order.paid
    await NexusEventBus.emit('order.paid', {
      v: 1,
      orderId: 'order-z-1',
      tenantId: 'tenant-z',
      operatorId: 'op-test',
      paymentMode: 'cb',
      totalInMicrounits: 15_000_000 as never,
      items: [{ productId: 'item-1', name: 'Plat', quantity: 1, unitPriceInMicrounits: 15_000_000 }] as never,
      tableId: 'table-1',
      occurredAt: '2026-09-03T12:00:00.000Z',
    });
    await new Promise((r) => setTimeout(r, 50));

    const zDoc1 = store['tenants/tenant-z/ticketZ/2026-09-03'] as { totalInMicrounits: number; ordersCount: number };
    expect(zDoc1).toBeDefined();
    expect(zDoc1.totalInMicrounits).toBe(15_000_000);
    expect(zDoc1.ordersCount).toBe(1);

    // 2ème envoi (rejeu)
    await NexusEventBus.emit('order.paid', {
      v: 1,
      orderId: 'order-z-1',
      tenantId: 'tenant-z',
      operatorId: 'op-test',
      paymentMode: 'cb',
      totalInMicrounits: 15_000_000 as never,
      items: [{ productId: 'item-1', name: 'Plat', quantity: 1, unitPriceInMicrounits: 15_000_000 }] as never,
      tableId: 'table-1',
      occurredAt: '2026-09-03T12:00:00.000Z',
    });
    await new Promise((r) => setTimeout(r, 50));

    const zDoc2 = store['tenants/tenant-z/ticketZ/2026-09-03'] as { totalInMicrounits: number; ordersCount: number };
    expect(zDoc2.totalInMicrounits).toBe(15_000_000); // Pas 30_000_000 !
    expect(zDoc2.ordersCount).toBe(1); // Pas 2 !

    unsub();
  });

  it('OrderCancelRestockHandler: passe status en cancelled et ne double-restitue pas', async () => {
    const store: Record<string, unknown> = {
      'tenants/tenant-inv/ops_flows/ord-cancel-1': {
        id: 'ord-cancel-1',
        status: 'pending',
        items: [{ productId: 'burger-1', quantity: 2 }],
      },
      'tenants/tenant-inv/recipes/burger-1': {
        id: 'burger-1',
        ingredients: [{ stockItemId: 'steak-1', quantity: 1 }],
      },
      'tenants/tenant-inv/stockItems/steak-1': {
        id: 'steak-1',
        quantity: 10,
      },
    };

    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
      return (store[path] as never) ?? null;
    });

    vi.spyOn(Nexus.adapter, 'update').mockImplementation(async (path: string, val: unknown) => {
      store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(val as Record<string, unknown>) };
    });

    vi.spyOn(Nexus.adapter, 'runTransaction').mockImplementation(async (callback) => {
      const tx = {
        get: async (path: string) => (store[path] as unknown) ?? null,
        set: async (path: string, val: unknown) => { store[path] = val; },
        update: async (path: string, val: unknown) => {
          store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(val as Record<string, unknown>) };
        },
        delete: async (path: string) => { delete store[path]; },
      };
      return callback(tx as never);
    });

    const unsub = registerOrderCancelRestockHandler();

    // 1ère annulation
    await NexusEventBus.emit('order.cancelled', {
      v: 1,
      orderId: 'ord-cancel-1',
      tenantId: 'tenant-inv',
      operatorId: 'op-test',
    });
    await new Promise((r) => setTimeout(r, 50));

    const steakAfter1 = store['tenants/tenant-inv/stockItems/steak-1'] as { quantity: number };
    expect(steakAfter1.quantity).toBe(12); // 10 + 2*1

    const orderAfter1 = store['tenants/tenant-inv/ops_flows/ord-cancel-1'] as { status: string };
    expect(orderAfter1.status).toBe('cancelled');

    // 2ème annulation (rejeu)
    await NexusEventBus.emit('order.cancelled', {
      v: 1,
      orderId: 'ord-cancel-1',
      tenantId: 'tenant-inv',
      operatorId: 'op-test',
    });
    await new Promise((r) => setTimeout(r, 50));

    const steakAfter2 = store['tenants/tenant-inv/stockItems/steak-1'] as { quantity: number };
    expect(steakAfter2.quantity).toBe(12); // Toujours 12, pas 14 !

    unsub();
  });
});
