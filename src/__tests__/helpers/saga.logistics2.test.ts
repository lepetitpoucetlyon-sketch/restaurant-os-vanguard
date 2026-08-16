import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockQuery, mockEmit, mockEmitDurable, mockOn, capturedHandlers } =
  vi.hoisted(() => {
    const capturedHandlers: Record<string, (payload: unknown) => Promise<void>> = {};
    const mockOn = vi.fn((event: string, cb: (p: unknown) => Promise<void>) => {
      capturedHandlers[event] = cb;
      return () => {};
    });
    return {
      mockGet: vi.fn<(...args: any[]) => Promise<any>>(async () => undefined),
      mockSet: vi.fn<(...args: any[]) => Promise<any>>(async () => undefined),
      mockUpdate: vi.fn<(...args: any[]) => Promise<any>>(async () => undefined),
      mockQuery: vi.fn<(...args: any[]) => Promise<any[]>>(async () => []),
      mockEmit: vi.fn<(...args: any[]) => Promise<any>>(async () => {}),
      mockEmitDurable: vi.fn<(...args: any[]) => Promise<any>>(async () => {}),
      mockOn,
      capturedHandlers,
    };
  });

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { registerAutoSupplierDraftHandler } from '@/shared/eventBus/handlers/AutoSupplierDraftHandler';
import { registerFoodCostRecomputer } from '@/shared/eventBus/handlers/FoodCostRecomputer';
import { registerFoodDonationHandler } from '@/shared/eventBus/handlers/FoodDonationHandler';
import { registerPhysicalInventoryHandler } from '@/shared/eventBus/handlers/PhysicalInventoryHandler';
import { registerStockRestitutionHandler } from '@/shared/eventBus/handlers/StockRestitutionHandler';
import { registerSupplierDeliveryReceivedHandler } from '@/shared/eventBus/handlers/SupplierDeliveryReceivedHandler';

const T = 'tenant-log';

// ─── Global spy setup (vi.spyOn on real singletons — path-agnostic) ─────────
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { SharedKernel } from '@/lib/shared-kernel';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';

beforeEach(() => {
  mockGet.mockClear();
  mockSet.mockClear();
  mockUpdate.mockClear();
  mockQuery.mockClear();
  mockEmit.mockClear();
  mockEmitDurable.mockClear();

  // NexusEventBus — use mockOn so capturedHandlers is populated
  vi.spyOn(NexusEventBus, 'on').mockImplementation(mockOn as typeof NexusEventBus.on);
  vi.spyOn(NexusEventBus, 'emit').mockImplementation(mockEmit as typeof NexusEventBus.emit);
  vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(mockEmitDurable as typeof NexusEventBus.emitDurable);
  // Nexus.adapter — delegate to hoisted vi.fn() mocks
  vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockGet as typeof Nexus.adapter.get);
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet as typeof Nexus.adapter.set);
  vi.spyOn(Nexus.adapter, 'update').mockImplementation(mockUpdate as typeof Nexus.adapter.update);
  vi.spyOn(Nexus.adapter, 'query').mockImplementation(mockQuery as typeof Nexus.adapter.query);
  // Real singletons
  vi.spyOn(empireAudit, 'log').mockImplementation(vi.fn());
  vi.spyOn(SharedKernel, 'generateId').mockImplementation(((p: string) => `${p}-id`) as typeof SharedKernel.generateId);
  vi.spyOn(FinancialNexusBridge, 'processRefund').mockResolvedValue(undefined as never);

  if (vi.isMockFunction(empireAudit.log)) (empireAudit.log as any).mockClear();
  if (vi.isMockFunction(FinancialNexusBridge.processRefund)) (FinancialNexusBridge.processRefund as any).mockClear();
});

describe('AutoSupplierDraftHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerAutoSupplierDraftHandler(); });

  it('crée un brouillon de commande fournisseur si aucun existant', async () => {
    mockGet.mockResolvedValue({ supplierId: 'supp-1', idealStock: 50 });
    mockQuery.mockResolvedValue([]);
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['stock.low']({
      tenantId: T, itemId: 'item-1', itemName: 'Farine', currentQuantity: 5, threshold: 20,
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/supplierOrders/`),
      expect.objectContaining({ supplierId: 'supp-1', status: 'draft' }),
    );
  });

  it('met à jour le brouillon existant si déjà ouvert', async () => {
    mockGet.mockResolvedValue({ supplierId: 'supp-1', idealStock: 50 });
    mockQuery.mockResolvedValue([{ id: 'draft-1', status: 'draft', supplierId: 'supp-1', items: [] }]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['stock.low']({
      tenantId: T, itemId: 'item-1', itemName: 'Farine', currentQuantity: 5, threshold: 20,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/supplierOrders/draft-1`,
      expect.objectContaining({ items: expect.any(Array) }),
    );
  });

  it('ne fait rien si l\'item n\'a pas de fournisseur', async () => {
    mockGet.mockResolvedValue({ supplierId: null });
    mockQuery.mockResolvedValue([]);

    await capturedHandlers['stock.low']({
      tenantId: T, itemId: 'item-2', itemName: 'Sucre', currentQuantity: 2, threshold: 10,
    });

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── FoodCostRecomputer ───────────────────────────────────────────────────────

describe('FoodCostRecomputer', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerFoodCostRecomputer(); });

  it('met à jour le coût des stocks et trace l\'invoice traitée', async () => {
    // Handler: update stockItems, then get stockItems + products + recipes
    mockUpdate.mockResolvedValue(undefined);
    mockGet
      .mockResolvedValueOnce({ 'ing-1': { id: 'ing-1', lastCostInMicrounits: 1500000 } }) // stockItems
      .mockResolvedValueOnce(null) // products (none)
      .mockResolvedValueOnce(null); // recipes (none)

    await capturedHandlers['supplier.invoice_processed']({
      tenantId: T, invoiceId: 'inv-1',
      lines: [{ stockItemId: 'ing-1', unitCostInMicrounits: 1500000, quantity: 10 }],
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/stockItems/ing-1`,
      expect.objectContaining({ lastCostInMicrounits: 1500000 }),
    );
  });
});

// ─── FoodDonationHandler ──────────────────────────────────────────────────────

describe('FoodDonationHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerFoodDonationHandler(); });

  it('génère un rapport de don pour les items périssables disponibles', async () => {
    mockQuery.mockResolvedValue([
      { id: 'item-1', name: 'Tomates', quantity: 3, category: 'perishable' },
      { id: 'item-2', name: 'Pâtes', quantity: 0, category: 'perishable' },
      { id: 'item-3', name: 'Boîte conserve', quantity: 10, category: 'non-perishable' },
    ]);
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['service.end']({ tenantId: T });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/donationReports/`),
      expect.objectContaining({ status: 'pending_collection' }),
    );
    const call = (mockSet.mock.calls[0] as any)?.[1];
    expect(call.items).toHaveLength(1);
    expect(call.items[0].name).toBe('Tomates');
  });

  it('ne crée pas de rapport si aucun item périssable disponible', async () => {
    mockQuery.mockResolvedValue([{ id: 'item-1', quantity: 0, category: 'perishable' }]);

    await capturedHandlers['service.end']({ tenantId: T });

    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── PhysicalInventoryHandler ─────────────────────────────────────────────────

describe('PhysicalInventoryHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerPhysicalInventoryHandler(); });

  it('met à jour les items dont la quantité physique diverge du théorique', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['inventory.physical']({
      tenantId: T, inventoryId: 'inv-1', operatorId: 'op-1',
      items: [
        { itemId: 'item-1', theoreticalQty: 50, physicalQty: 45 },
        { itemId: 'item-2', theoreticalQty: 30, physicalQty: 30 },
      ],
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/stockItems/item-1`, expect.objectContaining({ quantity: 45 }),
    );
    expect(mockUpdate).not.toHaveBeenCalledWith(
      `tenants/${T}/stockItems/item-2`, expect.anything(),
    );
  });
});

// ─── StockRestitutionHandler ──────────────────────────────────────────────────

describe('StockRestitutionHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerStockRestitutionHandler(); });

  it('restitue les ingrédients au stock si la commande est en état pending', async () => {
    mockGet
      .mockResolvedValueOnce({
        id: 'ord-1', status: 'pending', paymentMode: 'none',
        items: [{ productId: 'prod-1', name: 'Pizza', quantity: 1, priceInMicrounits: 5000000 }],
      })
      .mockResolvedValueOnce({
        id: 'prod-1', name: 'Pizza',
        recipe: { ingredients: [{ id: 'ing-1', name: 'Farine', quantity: 200 }] },
      })
      .mockResolvedValueOnce({ quantity: 1000, prmp: 2000 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.cancelled']({ tenantId: T, orderId: 'ord-1' });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/stockItems/ing-1`, expect.objectContaining({ quantity: 1200 }),
    );
  });

  it('ne fait rien si la commande est introuvable', async () => {
    mockGet.mockResolvedValue(null);
    await capturedHandlers['order.cancelled']({ tenantId: T, orderId: 'ghost' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── SupplierDeliveryReceivedHandler ──────────────────────────────────────────

describe('SupplierDeliveryReceivedHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerSupplierDeliveryReceivedHandler(); });

  it('met à jour les stocks à réception de la livraison fournisseur', async () => {
    const order = { id: 'po-1', status: 'open', items: [{ itemId: 'item-1', quantity: 50, unitPrice: 2000000 }] };
    mockGet.mockResolvedValue(order);

    const mockTx = {
      get: vi.fn(async () => ({ quantity: 100, prmp: 1800000 })),
      update: vi.fn(),
    };
    const nexusMod = await import('@/lib/nexus/NexusAdapter');
    (nexusMod.Nexus.adapter as unknown as Record<string, unknown>).runTransaction = vi.fn(
      async (fn: (t: typeof mockTx) => Promise<void>) => fn(mockTx),
    );

    await capturedHandlers['supplier.delivery_received']({ tenantId: T, orderId: 'po-1' });

    expect(mockTx.update).toHaveBeenCalledWith(
      `tenants/${T}/stockItems/item-1`,
      expect.objectContaining({ quantity: 150 }),
    );
  });

  it('ne fait rien si la commande fournisseur est introuvable', async () => {
    mockGet.mockResolvedValue(null);
    const nexusMod = await import('@/lib/nexus/NexusAdapter');
    (nexusMod.Nexus.adapter as unknown as Record<string, unknown>).runTransaction = vi.fn();

    await capturedHandlers['supplier.delivery_received']({ tenantId: T, orderId: 'ghost' });
    expect((nexusMod.Nexus.adapter as unknown as Record<string, unknown>).runTransaction).not.toHaveBeenCalled();
  });
});
