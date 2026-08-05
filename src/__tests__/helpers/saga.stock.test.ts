import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockQuery, mockEmitDurable, mockOn, mockFlagUnavailable, capturedHandlers } =
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
      mockQuery: vi.fn(),
      mockEmitDurable: vi.fn(),
      mockOn,
      mockFlagUnavailable: vi.fn(),
      capturedHandlers,
    };
  });

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { get: mockGet, set: mockSet, update: mockUpdate, query: mockQuery } },
}));
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { on: mockOn, emitDurable: mockEmitDurable },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/infrastructure/services/audit', () => ({
  empireAudit: { log: vi.fn() },
}));
vi.mock('@/domain/services/ProductAvailabilityService', () => ({
  ProductAvailabilityService: { flagUnavailable: mockFlagUnavailable },
}));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { registerStockDeductionHandler } from '@/shared/eventBus/handlers/StockDeductionHandler';
import { registerStockAlertHandler } from '@/shared/eventBus/handlers/StockAlertHandler';
import { registerStockReceptionHandler } from '@/shared/eventBus/handlers/StockReceptionHandler';
import { registerStockTransferHandler } from '@/shared/eventBus/handlers/StockTransferHandler';
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

describe('StockDeductionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerStockDeductionHandler();
  });

  it('déduit le stock via linkedStockItemId (déduction 1:1)', async () => {
    mockGet
      .mockResolvedValueOnce({ linkedStockItemId: 'stock-1' }) // product
      .mockResolvedValueOnce({ quantity: 50, reorderThreshold: 5 }); // stock item
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid'](baseOrderPaid);

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/tenant-a/stockItems/stock-1',
      expect.objectContaining({ quantity: 48 }),
    );
  });

  it('explose la BOM via recipeId et déduit chaque ingrédient', async () => {
    mockGet
      .mockResolvedValueOnce({ recipeId: 'recipe-1' }) // product
      .mockResolvedValueOnce({ // recipe
        ingredients: [
          { ingredientId: 'ing-1', name: 'Farine', quantity: 200 },
          { ingredientId: 'ing-2', name: 'Tomate', quantity: 100 },
        ],
      })
      .mockResolvedValueOnce({ quantity: 1000, reorderThreshold: 50 }) // ing-1 stock
      .mockResolvedValueOnce({ quantity: 500, reorderThreshold: 20 }); // ing-2 stock
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({ ...baseOrderPaid, items: [{ productId: 'prod-pizza', name: 'Pizza', quantity: 1, unitPriceInMicrounits: 1000000, priceInMicrounits: 1000000 }] });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/tenant-a/stockItems/ing-1',
      expect.objectContaining({ quantity: 800 }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/tenant-a/stockItems/ing-2',
      expect.objectContaining({ quantity: 400 }),
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

    await capturedHandlers['order.paid']({ ...baseOrderPaid, items: [{ productId: 'prod-1', name: 'Viande', quantity: 3, unitPriceInMicrounits: 1000000, priceInMicrounits: 3000000 }] });

    expect(mockEmitDurable).toHaveBeenCalledWith('stock.low', expect.objectContaining({ itemId: 'stock-low' }));
  });

  it('émet stock.zero si le stock atteint 0', async () => {
    mockGet
      .mockResolvedValueOnce({ linkedStockItemId: 'stock-zero' })
      .mockResolvedValueOnce({ quantity: 1, reorderThreshold: 5 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({ ...baseOrderPaid, items: [{ productId: 'p', name: 'Produit', quantity: 5, unitPriceInMicrounits: 500000, priceInMicrounits: 2500000 }] });

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
      .mockResolvedValueOnce({ quantity: 50, name: 'Farine' }) // item-1
      .mockResolvedValueOnce({ quantity: 20, name: 'Sucre' }); // item-2

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
    mockGet.mockResolvedValueOnce(null); // item inexistant → currentQty = 0

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
      .mockResolvedValueOnce({ id: 'po-1', status: 'open', items: [{ itemId: 'item-x', quantity: 10 }] }) // PO
      .mockResolvedValueOnce({ quantity: 5 }); // item-x

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
      .mockResolvedValueOnce({ id: 'po-2', status: 'open', items: [{ itemId: 'item-y', quantity: 50 }] }) // PO attend 50
      .mockResolvedValueOnce({ quantity: 0 }); // item-y

    await capturedHandlers['stock.received']({
      tenantId: 'tenant-c', deliveryId: 'del-4', purchaseOrderId: 'po-2',
      items: [{ itemId: 'item-y', quantity: 30 }], // reçu 30 ≠ attendu 50
    });

    const driftCall = mockSet.mock.calls.find(([path]: [string]) => path.includes('inventoryDrifts'));
    expect(driftCall).toBeDefined();
    expect(driftCall?.[1]).toMatchObject({
      drifts: [expect.objectContaining({ itemId: 'item-y', expected: 50, received: 30, diff: -20 })],
    });
  });
});

// ─── StockTransferHandler ─────────────────────────────────────────────────────
// Note: l'événement est 'stock.transfer' (sans le 'd' final)

describe('StockTransferHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerStockTransferHandler();
    mockUpdate.mockResolvedValue(undefined);
  });

  it('transfère la quantité de la source vers la destination', async () => {
    mockGet
      .mockResolvedValueOnce({ quantity: 100 }) // source
      .mockResolvedValueOnce({ quantity: 20 });  // destination

    await capturedHandlers['stock.transfer']({
      tenantId: 'tenant-d', transferId: 'tr-1',
      fromLocationId: 'loc-A', toLocationId: 'loc-B',
      itemId: 'ing-1', quantity: 30, itemName: 'Vin rouge',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining('loc-A'),
      expect.objectContaining({ quantity: 70 }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining('loc-B'),
      expect.objectContaining({ quantity: 50 }),
    );
  });

  it('ne descend pas sous 0 pour la source', async () => {
    mockGet
      .mockResolvedValueOnce({ quantity: 5 })  // source a moins que le transfert
      .mockResolvedValueOnce({ quantity: 0 }); // destination

    await capturedHandlers['stock.transfer']({
      tenantId: 'tenant-d', transferId: 'tr-2',
      fromLocationId: 'loc-A', toLocationId: 'loc-B',
      itemId: 'ing-2', quantity: 20, itemName: 'Huile',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining('loc-A'),
      expect.objectContaining({ quantity: 0 }),
    );
  });
});

// ─── StockZeroBlockerHandler ──────────────────────────────────────────────────

describe('StockZeroBlockerHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerStockZeroBlockerHandler();
    mockFlagUnavailable.mockResolvedValue(undefined);
  });

  it('bloque le produit lié directement via linkedStockItemId', async () => {
    mockQuery
      .mockResolvedValueOnce([
        { id: 'prod-fromage', linkedStockItemId: 'stock-1', name: 'Fromage' },
        { id: 'prod-autre', linkedStockItemId: 'stock-2', name: 'Autre' },
      ]) // products
      .mockResolvedValueOnce([]); // recipes

    await capturedHandlers['stock.zero']({ tenantId: 'T', itemId: 'stock-1', itemName: 'Fromage' });

    expect(mockFlagUnavailable).toHaveBeenCalledWith('T', 'prod-fromage', expect.stringContaining('stock_zero'));
    expect(mockFlagUnavailable).not.toHaveBeenCalledWith('T', 'prod-autre', expect.anything());
  });

  it('bloque les produits dont la recette utilise l\'ingrédient épuisé', async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: 'prod-pizza', recipeId: 'recipe-pizza', name: 'Pizza' }]) // products
      .mockResolvedValueOnce([
        { id: 'recipe-pizza', ingredients: [{ ingredientId: 'ing-farine', quantity: 200 }] },
      ]); // recipes

    await capturedHandlers['stock.zero']({ tenantId: 'T', itemId: 'ing-farine', itemName: 'Farine' });

    expect(mockFlagUnavailable).toHaveBeenCalledWith('T', 'prod-pizza', expect.stringContaining('stock_zero (recipe)'));
  });

  it('ne bloque rien si aucun produit n\'est lié', async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: 'prod-boisson', linkedStockItemId: 'stock-other' }])
      .mockResolvedValueOnce([]);

    await capturedHandlers['stock.zero']({ tenantId: 'T', itemId: 'stock-1', itemName: 'Camembert' });

    expect(mockFlagUnavailable).not.toHaveBeenCalled();
  });
});
