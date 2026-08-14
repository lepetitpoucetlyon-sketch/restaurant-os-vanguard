/**
 * §13 Politique de tier du bus — DEMO / TEST / REFERENCE
 *
 * Invariants testés :
 *  I1 — _ref_* : ACCESS_DENIED immédiat (event bloqué avant handlers)
 *  I2 — payload sans tenantId : SECURITY_BREACH / VALIDATION_ERROR
 *  I3 — _demo_* : isSimulation=true injecté dans le payload
 *  I4 — _demo_* : Nexus.activateSimulacraMode() appelé si Simulacra inactif
 *  I4b — _demo_* : Simulacra déjà actif → pas de double activation
 *  I5 — _test_* : passthrough normal, Simulacra non activé
 *  I6 — tenant réel : passthrough normal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusErrorCode } from '@nexus/errors';

// ── Mock offline-store (IndexedDB absent en Vitest node/jsdom) ────────────────
vi.mock('@/lib/offline/offline-store', () => ({
  db: {
    busOutbox: { put: vi.fn().mockResolvedValue(undefined) },
    deadLetterEvents: { put: vi.fn().mockResolvedValue(undefined) },
  },
}));

// ── Minimal payload helper ─────────────────────────────────────────────────────
const makePayload = (tenantId: string) => ({
  v: 1 as const,
  tenantId,
  fromLocationId: 'loc-a',
  toLocationId: 'loc-b',
  itemId: 'item-1',
  quantity: 1,
  operatorId: 'op',
});

describe('§13 Bus tier-policy', () => {
  let activateSpy: ReturnType<typeof vi.spyOn>;
  let isActiveSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy sur le singleton Nexus réel (la même instance que NexusEventBus utilise)
    activateSpy = vi.spyOn(Nexus, 'activateSimulacraMode').mockResolvedValue(undefined);
    isActiveSpy = vi.spyOn(Nexus, 'isSimulacraActive').mockReturnValue(false);
  });

  // ── I1 : _ref_* bloqué ──────────────────────────────────────────────────────
  it('[I1] _ref_* → ACCESS_DENIED, handlers NOT appelés', async () => {
    const handler = vi.fn();
    NexusEventBus.on('stock.transfer', handler, { id: 'test-ref-handler' });

    await expect(
      NexusEventBus.emit('stock.transfer', makePayload('_ref_restaurant'))
    ).rejects.toMatchObject({ code: NexusErrorCode.ACCESS_DENIED });

    expect(handler).not.toHaveBeenCalled();
    NexusEventBus.off('stock.transfer', 'test-ref-handler');
  });

  // ── I2 : payload sans tenantId ──────────────────────────────────────────────
  it('[I2] payload sans tenantId → VALIDATION_ERROR', async () => {
    const p = { v: 1 } as unknown as Parameters<typeof NexusEventBus.emit<'stock.transfer'>>[1];
    await expect(
      NexusEventBus.emit('stock.transfer', p)
    ).rejects.toMatchObject({ code: NexusErrorCode.VALIDATION_ERROR });
  });

  // ── I3 : _demo_* → isSimulation injecté ────────────────────────────────────
  it('[I3] _demo_* → payload.isSimulation = true injecté dans le handler', async () => {
    const captured: Array<{ isSimulation?: boolean }> = [];
    NexusEventBus.on('stock.transfer', async (p) => {
      captured.push(p as unknown as Record<string, unknown>);
    }, { id: 'test-demo-handler' });

    await NexusEventBus.emit('stock.transfer', makePayload('_demo_restaurant'));

    expect(captured[0]?.isSimulation).toBe(true);
    NexusEventBus.off('stock.transfer', 'test-demo-handler');
  });

  // ── I4 : _demo_* → Simulacra auto-activé ───────────────────────────────────
  it('[I4] _demo_* → Nexus.activateSimulacraMode() appelé si Simulacra inactif', async () => {
    // jsdom = window défini, condition typeof window !== 'undefined' = true
    isActiveSpy.mockReturnValue(false);

    NexusEventBus.on('stock.transfer', async () => {}, { id: 'test-demo-simulacra' });
    await NexusEventBus.emit('stock.transfer', makePayload('_demo_restaurant'));

    expect(activateSpy).toHaveBeenCalledWith(expect.stringContaining('_demo_restaurant'));
    NexusEventBus.off('stock.transfer', 'test-demo-simulacra');
  });

  // ── I4b : Simulacra déjà actif → pas de double activation ──────────────────
  it('[I4b] _demo_* Simulacra déjà actif → activateSimulacraMode PAS rappelé', async () => {
    isActiveSpy.mockReturnValue(true);

    NexusEventBus.on('stock.transfer', async () => {}, { id: 'test-demo-idempotent' });
    await NexusEventBus.emit('stock.transfer', makePayload('_demo_restaurant'));

    expect(activateSpy).not.toHaveBeenCalled();
    NexusEventBus.off('stock.transfer', 'test-demo-idempotent');
  });

  // ── I5 : _test_* → passthrough, Simulacra non activé ───────────────────────
  it('[I5] _test_* → handlers appelés, Simulacra non activé', async () => {
    const handler = vi.fn();
    NexusEventBus.on('stock.transfer', handler, { id: 'test-test-handler' });

    await NexusEventBus.emit('stock.transfer', makePayload('_test_restaurant'));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(activateSpy).not.toHaveBeenCalled();
    NexusEventBus.off('stock.transfer', 'test-test-handler');
  });

  // ── I6 : tenant réel → passthrough normal ───────────────────────────────────
  it('[I6] tenant réel → handlers appelés, pas de Simulacra', async () => {
    const handler = vi.fn();
    NexusEventBus.on('stock.transfer', handler, { id: 'test-real-handler' });

    await NexusEventBus.emit('stock.transfer', makePayload('tenant_123456789'));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(activateSpy).not.toHaveBeenCalled();
    NexusEventBus.off('stock.transfer', 'test-real-handler');
  });
});
