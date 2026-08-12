import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toMicrounits } from '@/shared/schemas/primitives';

const makePayload = () => ({
  v: 1 as const,
  orderId: 'order-1',
  tableId: 'table-3',
  tenantId: 'tenant-test',
  operatorId: 'op-1',
  items: [{
    cartId: 'c1', productId: 'p1', categoryId: 'cat1',
    name: 'Entrecôte', quantity: 2,
    unitPriceInMicrounits: toMicrounits(25_000_000),
    discountInMicrounits: toMicrounits(0),
    taxRate: '0.10' as const,
    modifiers: [],
  }],
  totalInMicrounits: 50_000_000,
  paymentMode: 'card',
});

describe('📡 NexusEventBus', () => {
  beforeEach(() => {
    // Nettoyer les handlers entre tests
    NexusEventBus['handlers'].clear();
  });

  it('appelle le handler à l\'émission', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    NexusEventBus.on('order.paid', handler, { id: 'test-1' });
    await NexusEventBus.emit('order.paid', makePayload());
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'order-1' }));
  });

  it('exécute CRITICAL avant HIGH avant BACKGROUND', async () => {
    const order: string[] = [];
    NexusEventBus.on('order.paid', async () => { order.push('BACKGROUND'); }, { id: 'bg', priority: 'BACKGROUND' });
    NexusEventBus.on('order.paid', async () => { order.push('HIGH'); }, { id: 'high', priority: 'HIGH' });
    NexusEventBus.on('order.paid', async () => { order.push('CRITICAL'); }, { id: 'crit', priority: 'CRITICAL' });
    await NexusEventBus.emit('order.paid', makePayload());
    // CRITICAL d'abord, HIGH ensuite, BACKGROUND en microtask
    expect(order[0]).toBe('CRITICAL');
    expect(order[1]).toBe('HIGH');
  });

  it('les handlers HIGH s\'exécutent en parallèle', async () => {
    const starts: number[] = [];
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    NexusEventBus.on('order.paid', async () => { starts.push(Date.now()); await delay(100); }, { id: 'h1', priority: 'HIGH' });
    NexusEventBus.on('order.paid', async () => { starts.push(Date.now()); await delay(100); }, { id: 'h2', priority: 'HIGH' });
    const t0 = Date.now();
    await NexusEventBus.emit('order.paid', makePayload());
    const elapsed = Date.now() - t0;
    // Si parallèle ≈ 100ms, si séquentiel ≈ 200ms
    expect(elapsed).toBeLessThan(180);
    expect(starts).toHaveLength(2);
  });

  it('une erreur CRITICAL remonte', async () => {
    NexusEventBus.on('order.paid', async () => { throw new Error('CRITICAL FAIL'); }, { id: 'fail', priority: 'CRITICAL' });
    await expect(NexusEventBus.emit('order.paid', makePayload())).rejects.toThrow('CRITICAL FAIL');
  });

  it('une erreur HIGH ne bloque pas les autres HIGH', async () => {
    const ok = vi.fn().mockResolvedValue(undefined);
    NexusEventBus.on('order.paid', async () => { throw new Error('HIGH FAIL'); }, { id: 'fail-high', priority: 'HIGH' });
    NexusEventBus.on('order.paid', ok, { id: 'ok-high', priority: 'HIGH' });
    await NexusEventBus.emit('order.paid', makePayload());
    expect(ok).toHaveBeenCalledOnce();
  });

  it('unsubscribe retire le handler', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const unsub = NexusEventBus.on('order.paid', handler, { id: 'unsub-test' });
    unsub();
    await NexusEventBus.emit('order.paid', makePayload());
    expect(handler).not.toHaveBeenCalled();
  });

  it('sans handlers, emit est silencieux', async () => {
    await expect(NexusEventBus.emit('order.paid', makePayload())).resolves.toBeUndefined();
  });
});
