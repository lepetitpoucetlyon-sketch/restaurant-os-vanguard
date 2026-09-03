import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { registerTicketZHandler } from '@/shared/eventBus/handlers/TicketZHandler';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';

describe('Lot 1 — Service Day Boundary & Ticket Z Aggregation Across Midnight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    NexusEventBus.resetForTesting();
    IdempotencyGuard.clearMemoryCache();
  });

  it('Les ventes de 23h30 et 01h30 s agrègent dans le Ticket Z de la MÊME journée de service', async () => {
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

    // Vente 1 : 23h30 locale (21h30 UTC le 2026-09-02)
    await NexusEventBus.emit('order.paid', {
      v: 1,
      orderId: 'ord-evening-1',
      tenantId: 'tenant-nightlife',
      operatorId: 'op-1',
      paymentMode: 'cb',
      totalInMicrounits: 25_000_000 as never,
      items: [{ productId: 'cocktail-1', name: 'Mojito', quantity: 2, unitPriceInMicrounits: 12_500_000 }] as never,
      tableId: 't-1',
      occurredAt: '2026-09-02T21:30:00.000Z',
    });
    await new Promise((r) => setTimeout(r, 50));

    // Vente 2 : 01h30 locale le lendemain (23h30 UTC le 2026-09-02)
    await NexusEventBus.emit('order.paid', {
      v: 1,
      orderId: 'ord-night-2',
      tenantId: 'tenant-nightlife',
      operatorId: 'op-1',
      paymentMode: 'cb',
      totalInMicrounits: 30_000_000 as never,
      items: [{ productId: 'cocktail-2', name: 'Gin Tonic', quantity: 2, unitPriceInMicrounits: 15_000_000 }] as never,
      tableId: 't-2',
      occurredAt: '2026-09-02T23:30:00.000Z',
    });
    await new Promise((r) => setTimeout(r, 50));

    // Vérification : les deux commandes doivent être dans le ticket Z du 2026-09-02
    const zServiceDoc = store['tenants/tenant-nightlife/ticketZ/2026-09-02'] as {
      totalInMicrounits: number;
      ordersCount: number;
    };
    expect(zServiceDoc).toBeDefined();
    expect(zServiceDoc.ordersCount).toBe(2);
    expect(zServiceDoc.totalInMicrounits).toBe(55_000_000);

    // Et aucun ticket Z ne doit avoir été créé pour 2026-09-03
    expect(store['tenants/tenant-nightlife/ticketZ/2026-09-03']).toBeUndefined();

    // Vente 3 : 05h30 locale le 3 septembre (03h30 UTC) -> après la coupure de 05h00
    await NexusEventBus.emit('order.paid', {
      v: 1,
      orderId: 'ord-morning-3',
      tenantId: 'tenant-nightlife',
      operatorId: 'op-1',
      paymentMode: 'cb',
      totalInMicrounits: 10_000_000 as never,
      items: [{ productId: 'coffee-1', name: 'Espresso', quantity: 2, unitPriceInMicrounits: 5_000_000 }] as never,
      tableId: 't-3',
      occurredAt: '2026-09-03T03:30:00.000Z',
    });
    await new Promise((r) => setTimeout(r, 50));

    const zNextDayDoc = store['tenants/tenant-nightlife/ticketZ/2026-09-03'] as {
      totalInMicrounits: number;
      ordersCount: number;
    };
    expect(zNextDayDoc).toBeDefined();
    expect(zNextDayDoc.ordersCount).toBe(1);
    expect(zNextDayDoc.totalInMicrounits).toBe(10_000_000);

    unsub();
  });
});
