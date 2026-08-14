/**
 * Tests StockTransferHandler — garantit l'isolation intra-tenant.
 *
 * Invariant P0 : aucun chemin Nexus ne sort de `tenants/{tenantId}/`.
 * fromLocationId et toLocationId sont des emplacements de stockage,
 * jamais des tenantIds.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { registerStockTransferHandler } from '@orchestration/handlers/StockTransferHandler';
import { empireAudit } from '@/lib/audit';

vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));

describe('StockTransferHandler', () => {
  let capturedHandler: ((payload: Record<string, unknown>) => Promise<void>) | null = null;

  beforeEach(() => {
    capturedHandler = null;
    vi.spyOn(NexusEventBus, 'on').mockImplementation((_event, handler) => {
      capturedHandler = handler as (payload: Record<string, unknown>) => Promise<void>;
      return () => {};
    });
    vi.mocked(empireAudit.log).mockClear();
  });

  it('inscrit un handler sur stock.transfer', () => {
    registerStockTransferHandler();
    expect(NexusEventBus.on).toHaveBeenCalledWith('stock.transfer', expect.any(Function), expect.any(Object));
  });

  it('[INVARIANT P0] le chemin Nexus ne sort jamais de tenants/{tenantId}/', async () => {
    registerStockTransferHandler();
    expect(capturedHandler).not.toBeNull();

    const TENANT = 'tenant-abc';
    const ITEM_ID = 'item-xyz';
    const FROM_LOC = 'loc-cuisine';
    const TO_LOC   = 'loc-frigo';

    const getPaths: string[] = [];
    const updatePaths: string[] = [];

    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path) => {
      getPaths.push(path as string);
      return { storageLocationId: FROM_LOC, quantity: 10 };
    });
    vi.spyOn(Nexus.adapter, 'update').mockImplementation(async (path) => {
      updatePaths.push(path as string);
    });

    await capturedHandler!({
      tenantId: TENANT,
      fromLocationId: FROM_LOC,
      toLocationId: TO_LOC,
      itemId: ITEM_ID,
      quantity: 5,
      operatorId: 'op-1',
    });

    // Tous les accès Nexus doivent rester dans tenants/{TENANT}/
    for (const p of [...getPaths, ...updatePaths]) {
      expect(p).toMatch(new RegExp(`^tenants/${TENANT}/`));
      expect(p).not.toContain(FROM_LOC);  // FROM_LOC n'est PAS un tenantId
      expect(p).not.toContain(TO_LOC);    // TO_LOC n'est PAS un tenantId
    }

    // Le chemin exact utilisé
    expect(getPaths[0]).toBe(`tenants/${TENANT}/stockItems/${ITEM_ID}`);
    expect(updatePaths[0]).toBe(`tenants/${TENANT}/stockItems/${ITEM_ID}`);
  });

  it('met à jour storageLocationId (pas quantity) sur le bon document', async () => {
    registerStockTransferHandler();
    const updateSpy = vi.spyOn(Nexus.adapter, 'update').mockResolvedValue(undefined);
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValue({ storageLocationId: 'loc-a', quantity: 20 });

    await capturedHandler!({
      tenantId: 'T1',
      fromLocationId: 'loc-a',
      toLocationId: 'loc-b',
      itemId: 'I1',
      quantity: 10,
      operatorId: 'op',
    });

    expect(updateSpy).toHaveBeenCalledWith(
      'tenants/T1/stockItems/I1',
      expect.objectContaining({ storageLocationId: 'loc-b' })
    );
    // quantity ne doit PAS être modifiée dans l'update
    const updateArg = updateSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(updateArg).not.toHaveProperty('quantity');
  });

  it('log un warn si le stockItem est introuvable (pas de crash)', async () => {
    registerStockTransferHandler();
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValue(null);
    const updateSpy = vi.spyOn(Nexus.adapter, 'update').mockResolvedValue(undefined);

    await expect(
      capturedHandler!({
        tenantId: 'T1',
        fromLocationId: 'loc-a',
        toLocationId: 'loc-b',
        itemId: 'MISSING',
        quantity: 5,
        operatorId: 'op',
      })
    ).resolves.not.toThrow();

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('enregistre un audit avec tenantId et les deux emplacements', async () => {
    registerStockTransferHandler();
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValue({ storageLocationId: 'loc-a' });
    vi.spyOn(Nexus.adapter, 'update').mockResolvedValue(undefined);

    await capturedHandler!({
      tenantId: 'T2',
      fromLocationId: 'loc-a',
      toLocationId: 'loc-b',
      itemId: 'I2',
      quantity: 3,
      operatorId: 'usr-99',
    });

    expect(empireAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STOCK_TRANSFERRED',
        details: expect.objectContaining({
          tenantId: 'T2',
          fromLocationId: 'loc-a',
          toLocationId: 'loc-b',
        }),
      })
    );
  });
});
