import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusEventBus, IdempotencyGuard } from '@/shared/eventBus/NexusEventBus';

describe('V3-BUS-04/05/06: NexusEventBus Multi-Caisse & Idempotence Suite', () => {
  beforeEach(() => {
    IdempotencyGuard.clearMemoryCache();
  });

  it('[V3-BUS-04] allows concurrent multi-caisse emissions of the same event with different eventIds', async () => {
    const processedOrders: string[] = [];

    const unsubscribe = NexusEventBus.on(
      'order.placed',
      async (payload) => {
        // Simule un petit délai asynchrone
        await new Promise((resolve) => setTimeout(resolve, 5));
        processedOrders.push(payload.orderId);
      },
      { id: 'handler-multi-caisse-test', priority: 'HIGH', idempotent: false }
    );

    // Émissions concurrentes de deux caisses différentes
    await Promise.all([
      NexusEventBus.emit('order.placed', { orderId: 'ord_caisse_1', tenantId: 'resto_1' } as any),
      NexusEventBus.emit('order.placed', { orderId: 'ord_caisse_2', tenantId: 'resto_1' } as any),
    ]);

    expect(processedOrders).toContain('ord_caisse_1');
    expect(processedOrders).toContain('ord_caisse_2');
    expect(processedOrders.length).toBe(2);

    unsubscribe();
  });

  it('[V3-BUS-04] prevents recursive loop on the exact same event instance', async () => {
    let callCount = 0;

    const unsubscribe = NexusEventBus.on(
      'order.placed',
      async (payload) => {
        callCount++;
        if (callCount < 5) {
          // Re-émet le même événement avec le même eventId
          await NexusEventBus.emit('order.placed', payload);
        }
      },
      { id: 'handler-loop-breaker-test', priority: 'HIGH', idempotent: false }
    );

    const payload = { eventId: 'evt_recursive_loop', orderId: 'ord_loop', tenantId: 'resto_1' };
    await NexusEventBus.emit('order.placed', payload as any);

    // Ne doit s'exécuter qu'une seule fois car le second appel récursif sur le même eventId est intercepté
    expect(callCount).toBe(1);

    unsubscribe();
  });

  it('[V3-BUS-05] automatically assigns eventId when missing on payload', async () => {
    let receivedEventId: string | undefined;

    const unsubscribe = NexusEventBus.on(
      'stock.low',
      (payload: any) => {
        receivedEventId = payload.eventId;
      },
      { id: 'handler-event-id-check' }
    );

    const payload: any = { itemId: 'item_123', quantity: 10, tenantId: 'resto_1' };
    await NexusEventBus.emit('stock.low', payload);

    expect(receivedEventId).toBeDefined();
    expect(typeof receivedEventId).toBe('string');
    expect(receivedEventId?.length).toBeGreaterThan(0);

    unsubscribe();
  });

  it('[V3-BUS-06] dedups replayed events on idempotent CRITICAL handlers', async () => {
    let executionCount = 0;

    const unsubscribe = NexusEventBus.on(
      'order.paid',
      async () => {
        executionCount++;
      },
      { id: 'handler-critical-dedup-test', priority: 'CRITICAL' }
    );

    const payload = {
      eventId: 'evt_payment_unique_99',
      orderId: 'ord_99',
      totalInMicrounits: 50000000,
      tenantId: 'resto_1',
    };

    // 1ère émission
    await NexusEventBus.emit('order.paid', payload as any);
    expect(executionCount).toBe(1);

    // 2ème émission avec le même eventId (rejeu réseau / offline sync)
    await NexusEventBus.emit('order.paid', payload as any);
    expect(executionCount).toBe(1); // Dédupliqué !

    unsubscribe();
  });
});
