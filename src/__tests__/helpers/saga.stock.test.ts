import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockIncrement, mockQuery, mockEmitDurable, mockOn, capturedHandlers } =
  vi.hoisted(() => {
    const capturedHandlers: Record<string, (payload: unknown) => Promise<void>> = {};
    const mockOn = vi.fn((event: string, cb: (p: unknown) => Promise<void>) => {
      capturedHandlers[event] = cb;
      return () => {};
    });
    return {
      mockGet: vi.fn(),
      mockSet: vi.fn(),
      mockUpdate: vi.fn(),
      mockIncrement: vi.fn(),
      mockQuery: vi.fn(),
      mockEmitDurable: vi.fn(),
      mockOn,
      capturedHandlers,
    };
  });

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { registerStockDeductionHandler } from '@/shared/eventBus/handlers/StockDeductionHandler';
import { registerStockAlertHandler } from '@/shared/eventBus/handlers/StockAlertHandler';
import { registerStockReceptionHandler } from '@/shared/eventBus/handlers/StockReceptionHandler';
import { registerStockZeroBlockerHandler } from '@/shared/eventBus/handlers/StockZeroBlockerHandler';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const baseOrderPaid = {
  v: 1 as const,
  tenantId: 'tenant-a',
  orderId: 'ord-1',
  tableId: 'tbl-1',
  operatorId: 'op-1',
  paymentMode: 'card' as const,
  totalInMicrounits: 2000000,
  items: [{ productId: 'prod-1', name: 'Pizza', quantity: 2, unitPriceInMicrounits: 1000000, priceInMicrounits: 2000000 }],
  splits: undefined,
  customerId: undefined,
};

// ─── StockDeductionHandler ─────────────────────────────────────────────────────


// ─── Global spy setup (vi.spyOn on real singletons — path-agnostic) ─────────
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

beforeEach(() => {
  vi.restoreAllMocks();
  // NexusEventBus — use mockOn so capturedHandlers is populated
  vi.spyOn(NexusEventBus, 'on').mockImplementation(mockOn as typeof NexusEventBus.on);
  vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined);
  vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(mockEmitDurable as typeof NexusEventBus.emitDurable);
  // Nexus.adapter — delegate to hoisted vi.fn() mocks
  vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockGet as typeof Nexus.adapter.get);
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet as typeof Nexus.adapter.set);
  vi.spyOn(Nexus.adapter, 'update').mockImplementation(mockUpdate as typeof Nexus.adapter.update);
  vi.spyOn(Nexus.adapter, 'increment').mockImplementation(mockIncrement as typeof Nexus.adapter.increment);
  vi.spyOn(Nexus.adapter, 'query').mockImplementation(mockQuery as typeof Nexus.adapter.query);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StockDeductionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerStockDeductionHandler();
  });

  it('déduit le stock via linkedStockItemId (déduction 1:1)', async () => {
    mockGet
      .mockResolvedValueOnce({ linkedStockItemId: 'stock-1' })
      .mockResolvedValueOnce({ quantity: 50, reorderThreshold: 5 });
    mockUpdate.mockResolvedValue(undefined);
    mockIncrement.mockResolvedValue(undefined);

    await capturedHandlers['order.paid'](baseOrderPaid);

    expect(mockIncrement).toHaveBeenCalledWith(
      'tenants/tenant-a/stockItems/stock-1',
      'quantity',
      -2,
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/tenant-a/stockItems/stock-1',
      expect.objectContaining({ updatedAt: expect.any(String) }),
    );
  });

  it('explose la BOM via recipeId et déduit chaque ingrédient', async () => {
    mockGet
      .mockResolvedValueOnce({ recipeId: 'recipe-1' })
      .mockResolvedValueOnce({
        ingredients: [
          { ingredientId: 'ing-1', name: 'Farine', quantity: 200 },
          { ingredientId: 'ing-2', name: 'Tomate', quantity: 100 },
        ],
      })
      .mockResolvedValueOnce({ quantity: 1000, reorderThreshold: 50 })
      .mockResolvedValueOnce({ quantity: 500, reorderThreshold: 20 });
    mockUpdate.mockResolvedValue(undefined);
    mockIncrement.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      ...baseOrderPaid,
      items: [{ productId: 'prod-pizza', name: 'Pizza', quantity: 1, unitPriceInMicrounits: 1000000, priceInMicrounits: 1000000 }],
    });

    expect(mockIncrement).toHaveBeenCalledWith(
      'tenants/tenant-a/stockItems/ing-1',
      'quantity',
      -200,
    );
    expect(mockIncrement).toHaveBeenCalledWith(
      'tenants/tenant-a/stockItems/ing-2',
      'quantity',
      -100,
    );
  });

  it('ne fait rien si product introuvable', async () => {
    mockGet.mockResolvedValueOnce(null);

    await capturedHandlers['order.paid'](baseOrderPaid);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ne fait rien si product sans linkedStockItemId ni recipeId', async () => {
    mockGet.mockResolvedValueOnce({ name: 'Boisson' });

    await capturedHandlers['order.paid'](baseOrderPaid);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('émet stock.low si le stock passe sous le seuil', async () => {
    mockGet
      .mockResolvedValueOnce({ linkedStockItemId: 'stock-low' })
      .mockResolvedValueOnce({ quantity: 8, reorderThreshold: 10 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      ...baseOrderPaid,
      items: [{ productId: 'prod-1', name: 'Viande', quantity: 3, unitPriceInMicrounits: 1000000, priceInMicrounits: 3000000 }],
    });

    expect(mockEmitDurable).toHaveBeenCalledWith('stock.low', expect.objectContaining({ itemId: 'stock-low' }));
  });

  it('émet stock.zero si le stock atteint 0', async () => {
    mockGet
      .mockResolvedValueOnce({ linkedStockItemId: 'stock-zero' })
      .mockResolvedValueOnce({ quantity: 1, reorderThreshold: 5 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      ...baseOrderPaid,
      items: [{ productId: 'p', name: 'Produit', quantity: 5, unitPriceInMicrounits: 500000, priceInMicrounits: 2500000 }],
    });

    expect(mockEmitDurable).toHaveBeenCalledWith('stock.zero', expect.objectContaining({ itemId: 'stock-zero' }));
  });
});

// ─── StockAlertHandler ────────────────────────────────────────────────────────

describe('StockAlertHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerStockAlertHandler();
  });

  it('persiste une alerte stock.low dans Nexus', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['stock.low']({
      tenantId: 'tenant-b', itemId: 'ing-sel', itemName: 'Sel',
      currentQuantity: 5, threshold: 20,
    });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/tenant-b/stockAlerts/ing-sel',
      expect.objectContaining({ itemId: 'ing-sel', status: 'PENDING', currentQuantity: 5 }),
    );
  });

  it('désactive le produit si le stock est à 0', async () => {
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['stock.low']({
      tenantId: 'tenant-b', itemId: 'ing-zero', itemName: 'Farine',
      currentQuantity: 0, threshold: 10,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/tenant-b/products/ing-zero',
      expect.objectContaining({ available: false }),
    );
  });

  it('ne désactive PAS le produit si le stock est > 0', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['stock.low']({
      tenantId: 'tenant-b', itemId: 'ing-low', itemName: 'Beurre',
      currentQuantity: 3, threshold: 10,
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── StockReceptionHandler ────────────────────────────────────────────────────

describe('StockReceptionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerStockReceptionHandler();
    mockSet.mockResolvedValue(undefined);
  });

  it('incrémente la quantité de chaque article reçu', async () => {
    // purchaseOrderId: null → pas de fetch PO → premier get = item-1, deuxième = item-2
    mockGet
      .mockResolvedValueOnce({ quantity: 50, name: 'Farine' })
      .mockResolvedValueOnce({ quantity: 20, name: 'Sucre' });

    await capturedHandlers['stock.received']({
      tenantId: 'tenant-c', deliveryId: 'del-1', purchaseOrderId: null,
      items: [{ itemId: 'item-1', quantity: 25 }, { itemId: 'item-2', quantity: 10 }],
    });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/tenant-c/stockItems/item-1',
      expect.objectContaining({ quantity: 75 }),
    );
    expect(mockSet).toHaveBeenCalledWith(
      'tenants/tenant-c/stockItems/item-2',
      expect.objectContaining({ quantity: 30 }),
    );
  });

  it('crée un stock item si inexistant (qty = 0 + réception)', async () => {
    mockGet.mockResolvedValueOnce(null);

    await capturedHandlers['stock.received']({
      tenantId: 'tenant-c', deliveryId: 'del-2', purchaseOrderId: null,
      items: [{ itemId: 'item-new', quantity: 100 }],
    });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/tenant-c/stockItems/item-new',
      expect.objectContaining({ quantity: 100 }),
    );
  });

  it('récupère le bon de commande si purchaseOrderId fourni', async () => {
    mockGet
      .mockResolvedValueOnce({ id: 'po-1', status: 'open', items: [{ itemId: 'item-x', quantity: 10 }] })
      .mockResolvedValueOnce({ quantity: 5 });

    await capturedHandlers['stock.received']({
      tenantId: 'tenant-c', deliveryId: 'del-3', purchaseOrderId: 'po-1',
      items: [{ itemId: 'item-x', quantity: 10 }],
    });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/tenant-c/stockItems/item-x',
      expect.objectContaining({ quantity: 15 }),
    );
  });

  it('persiste un drift report si les quantités divergent du BC', async () => {
    mockGet
      .mockResolvedValueOnce({ id: 'po-2', status: 'open', items: [{ itemId: 'item-y', quantity: 50 }] })
      .mockResolvedValueOnce({ quantity: 0 });

    await capturedHandlers['stock.received']({
      tenantId: 'tenant-c', deliveryId: 'del-4', purchaseOrderId: 'po-2',
      items: [{ itemId: 'item-y', quantity: 30 }],
    });

    const driftCall = mockSet.mock.calls.find(([path]: [string]) => path.includes('inventoryDrifts'));
    expect(driftCall).toBeDefined();
    expect(driftCall?.[1]).toMatchObject({
      drifts: [expect.objectContaining({ itemId: 'item-y', expected: 50, received: 30, diff: -20 })],
    });
  });
});

// ─── StockTransferHandler ─────────────────────────────────────────────────────
// Handler supprimé (audit LOGIQUE MÉTIER 2026-08-30 P1) : stock.transfer
// n'était jamais émis, ce handler était mort. Tests retirés.

// ─── StockZeroBlockerHandler ──────────────────────────────────────────────────
// ProductAvailabilityService.flagUnavailable appelle Nexus.adapter.get + update (déjà mockés)

describe('StockZeroBlockerHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Purge explicite de la file once de mockGet : les tests StockTransferHandler
    // en cas d'échec partiel peuvent laisser des mockResolvedValueOnce non consommés
    // qui prendraient la priorité sur mockResolvedValue dans ProductAvailabilityService.
    mockGet.mockReset();
    registerStockZeroBlockerHandler();
    mockUpdate.mockResolvedValue(undefined);
  });

  it('bloque le produit lié directement via linkedStockItemId', async () => {
    mockQuery
      .mockResolvedValueOnce([
        { id: 'prod-fromage', linkedStockItemId: 'stock-1', name: 'Fromage' },
        { id: 'prod-autre', linkedStockItemId: 'stock-2', name: 'Autre' },
      ])
      .mockResolvedValueOnce([]);
    // ProductAvailabilityService.flagUnavailable fetches the product first
    mockGet.mockResolvedValue({ id: 'prod-fromage', name: 'Fromage', isAvailable: true });

    await capturedHandlers['stock.zero']({ tenantId: 'T', itemId: 'stock-1', itemName: 'Fromage' });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/products/prod-fromage',
      expect.objectContaining({ isAvailable: false }),
    );
  });

  it('ne bloque pas les produits non liés à l\'item épuisé', async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: 'prod-autre', linkedStockItemId: 'stock-99' }])
      .mockResolvedValueOnce([]);

    await capturedHandlers['stock.zero']({ tenantId: 'T', itemId: 'stock-1', itemName: 'Camembert' });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('bloque les produits dont la recette utilise l\'ingrédient épuisé', async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: 'prod-pizza', recipeId: 'recipe-pizza', name: 'Pizza' }])
      .mockResolvedValueOnce([
        { id: 'recipe-pizza', ingredients: [{ ingredientId: 'ing-farine', quantity: 200 }] },
      ]);
    mockGet.mockResolvedValue({ id: 'prod-pizza', name: 'Pizza', isAvailable: true });

    await capturedHandlers['stock.zero']({ tenantId: 'T', itemId: 'ing-farine', itemName: 'Farine' });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/products/prod-pizza',
      expect.objectContaining({ isAvailable: false }),
    );
  });
});
