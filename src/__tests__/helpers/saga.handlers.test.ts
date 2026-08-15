import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

// ─── Hoisted mocks (accessibles dans vi.mock factories) ────────────────────────

const { mockNexusGet, mockNexusUpdate, mockNexusSet, mockEmitDurable, mockOn, capturedHandlers,
  mockConnectorSyncPeriod, mockJotaiGet, mockJotaiSet } = vi.hoisted(() => {
  const capturedHandlers: Record<string, (payload: unknown) => Promise<void>> = {};
  const mockOn = vi.fn((event: string, cb: (p: unknown) => Promise<void>) => {
    capturedHandlers[event] = cb;
    return () => {};
  });
  return {
    mockNexusGet:    vi.fn(),
    mockNexusUpdate: vi.fn(),
    mockNexusSet:    vi.fn(),
    mockEmitDurable: vi.fn(),
    mockOn,
    capturedHandlers,
    mockConnectorSyncPeriod: vi.fn(),
    mockJotaiGet: vi.fn(() => ({})),
    mockJotaiSet: vi.fn(),
  };
});



vi.mock('jotai', () => ({
  getDefaultStore: vi.fn(() => ({ get: mockJotaiGet, set: mockJotaiSet })),
}));

vi.mock('@/store/pillars/compliance', () => ({
  quarantinedProductsAtom: {},
}));

vi.mock('@/modules/human/remuneration/payroll/PrepaieBuilder', () => ({
  PrepaieBuilder: { build: vi.fn(async () => ({ employees: [] })) },
}));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { registerWasteStockReconciliationHandler } from '@/shared/eventBus/handlers/WasteStockReconciliationHandler';
import { registerMarginWarningHandler }            from '@/shared/eventBus/handlers/MarginWarningHandler';
import { PayrollExportHandler }                    from '@/shared/eventBus/handlers/PayrollExportHandler';

// ─── Global spy setup (vi.spyOn on real singletons — path-agnostic) ─────────
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { PayrollConnectorFactory } from '@/modules/human/connectors/payroll/PayrollConnectorFactory';

beforeEach(() => {
  mockNexusGet.mockClear();
  mockNexusSet.mockClear();
  mockNexusUpdate.mockClear();
  mockEmitDurable.mockClear();
  mockConnectorSyncPeriod.mockClear();
  mockJotaiSet.mockClear();

  // NexusEventBus — use mockOn so capturedHandlers is populated
  vi.spyOn(NexusEventBus, 'on').mockImplementation(mockOn as typeof NexusEventBus.on);
  vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined);
  vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(mockEmitDurable as typeof NexusEventBus.emitDurable);
  // Nexus.adapter — delegate to hoisted vi.fn() mocks
  vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockNexusGet as typeof Nexus.adapter.get);
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockNexusSet as typeof Nexus.adapter.set);
  vi.spyOn(Nexus.adapter, 'update').mockImplementation(mockNexusUpdate as typeof Nexus.adapter.update);
  vi.spyOn(Nexus.adapter, 'query').mockResolvedValue([]);
  // Real singletons
  vi.spyOn(empireAudit, 'log').mockImplementation(vi.fn());
  vi.spyOn(logger, 'warn').mockImplementation(vi.fn());
  vi.spyOn(logger, 'info').mockImplementation(vi.fn());
  vi.spyOn(logger, 'error').mockImplementation(vi.fn());
  vi.spyOn(PayrollConnectorFactory, 'get').mockReturnValue({ id: 'silae', syncPeriod: mockConnectorSyncPeriod } as never);

  if (vi.isMockFunction(logger.warn)) (logger.warn as any).mockClear();
  if (vi.isMockFunction(empireAudit.log)) (empireAudit.log as any).mockClear();
});

describe('WasteStockReconciliationHandler', () => {
  beforeEach(() => {
    mockNexusGet.mockClear();
    mockNexusSet.mockClear();
    mockNexusUpdate.mockClear();
    mockEmitDurable.mockClear();
    mockConnectorSyncPeriod.mockClear();
    mockJotaiSet.mockClear();
    registerWasteStockReconciliationHandler();
  });

  it('soustrait la quantité de déchet du stock existant', async () => {
    mockNexusGet.mockResolvedValueOnce({ quantity: 100, reorderThreshold: 10 });
    mockNexusUpdate.mockResolvedValueOnce(undefined);

    await capturedHandlers['waste.logged']({
      tenantId: 'tenant-1', wasteId: 'w-1', ingredientId: 'ing-1',
      ingredientName: 'Farine', quantity: 30, reason: 'périmé',
    });

    expect(mockNexusUpdate).toHaveBeenCalledWith(
      'tenants/tenant-1/stockItems/ing-1',
      expect.objectContaining({ quantity: 70 })
    );
  });

  it('ne tombe pas en dessous de 0 si déchet > stock', async () => {
    mockNexusGet.mockResolvedValueOnce({ quantity: 5, reorderThreshold: 10 });
    mockNexusUpdate.mockResolvedValueOnce(undefined);

    await capturedHandlers['waste.logged']({
      tenantId: 'tenant-1', wasteId: 'w-2', ingredientId: 'ing-2',
      ingredientName: 'Sel', quantity: 20, reason: 'renversé',
    });

    expect(mockNexusUpdate).toHaveBeenCalledWith(
      'tenants/tenant-1/stockItems/ing-2',
      expect.objectContaining({ quantity: 0 })
    );
  });

  it('émet stock.low si le nouveau stock passe sous le seuil', async () => {
    mockNexusGet.mockResolvedValueOnce({ quantity: 15, reorderThreshold: 10 });
    mockNexusUpdate.mockResolvedValueOnce(undefined);

    await capturedHandlers['waste.logged']({
      tenantId: 'tenant-1', wasteId: 'w-3', ingredientId: 'ing-3',
      ingredientName: 'Beurre', quantity: 8, reason: 'avarie',
    });

    expect(mockEmitDurable).toHaveBeenCalledWith('stock.low', expect.objectContaining({
      v: 1, tenantId: 'tenant-1', itemId: 'ing-3', currentQuantity: 7, threshold: 10,
    }));
  });

  it('log un warning si le stockItem est introuvable et s\'arrête', async () => {
    mockNexusGet.mockResolvedValueOnce(null);
    const { logger } = await import('@/lib/logger');

    await capturedHandlers['waste.logged']({
      tenantId: 'tenant-1', wasteId: 'w-4', ingredientId: 'ing-404',
      ingredientName: 'Inconnu', quantity: 1, reason: 'test',
    });

    expect(mockNexusUpdate).not.toHaveBeenCalled();
    expect((logger.warn as Mock)).toHaveBeenCalled();
  });
});

// ─── MarginWarningHandler ─────────────────────────────────────────────────────

describe('MarginWarningHandler', () => {
  beforeEach(() => {
    mockNexusGet.mockClear();
    mockNexusSet.mockClear();
    mockNexusUpdate.mockClear();
    mockEmitDurable.mockClear();
    mockConnectorSyncPeriod.mockClear();
    mockJotaiSet.mockClear();
    vi.stubGlobal('crypto', { randomUUID: () => 'alert-uuid-1' });
    registerMarginWarningHandler();
  });

  it('persiste une alerte marge dans Nexus', async () => {
    mockNexusSet.mockResolvedValueOnce(undefined);

    await capturedHandlers['commerce.margin_warning']({
      tenantId: 'tenant-1', productId: 'prod-abc',
      currentMarginBps: 1800, thresholdBps: 2500, triggerEventId: 'inv-42',
    });

    expect(mockNexusSet).toHaveBeenCalledWith(
      'tenants/tenant-1/marginAlerts/alert-uuid-1',
      expect.objectContaining({ productId: 'prod-abc', currentMarginBps: 1800, status: 'open' })
    );
  });

  it('relance l\'erreur vers la DLQ si Nexus.set échoue', async () => {
    mockNexusSet.mockRejectedValueOnce(new Error('Firestore timeout'));

    await expect(
      capturedHandlers['commerce.margin_warning']({
        tenantId: 'tenant-1', productId: 'prod-xyz',
        currentMarginBps: 1200, thresholdBps: 2500, triggerEventId: 'inv-99',
      })
    ).rejects.toThrow('Firestore timeout');
  });
});

// ─── PayrollExportHandler ─────────────────────────────────────────────────────

describe('PayrollExportHandler', () => {
  beforeEach(() => {
    mockNexusGet.mockClear();
    mockNexusSet.mockClear();
    mockNexusUpdate.mockClear();
    mockEmitDurable.mockClear();
    mockConnectorSyncPeriod.mockClear();
    mockJotaiSet.mockClear();
    PayrollExportHandler.register();
  });

  const basePayload = {
    tenantId: 'tenant-rh', periodId: '2026-07',
    validatedBy: 'manager-1', totalEmployees: 12, isSimulation: false,
  };

  it('exporte via le provider configuré et marque le statut completed', async () => {
    mockNexusGet.mockResolvedValueOnce({ provider: 'silae' });
    mockConnectorSyncPeriod.mockResolvedValueOnce({
      success: true, employeesUpserted: 12, variablesAccepted: 48,
      errors: [], externalRef: 'REF-SILAE-001',
    });
    mockNexusUpdate.mockResolvedValueOnce(undefined);

    await capturedHandlers['hr.preroll_validated'](basePayload);

    expect(mockNexusUpdate).toHaveBeenCalledWith(
      'tenants/tenant-rh/hr/payroll_exports/2026-07',
      expect.objectContaining({ status: 'completed', provider: 'silae' })
    );
  });

  it('ne fait rien si isSimulation=true', async () => {
    await capturedHandlers['hr.preroll_validated']({ ...basePayload, isSimulation: true });
    expect(mockNexusGet).not.toHaveBeenCalled();
  });

  it('met en file d\'attente si aucun provider n\'est configuré', async () => {
    mockNexusGet.mockResolvedValueOnce(null);
    delete process.env.PAYROLL_DEFAULT_PROVIDER;
    mockNexusUpdate.mockResolvedValueOnce(undefined);

    await capturedHandlers['hr.preroll_validated'](basePayload);

    expect(mockNexusUpdate).toHaveBeenCalledWith(
      'tenants/tenant-rh/hr/pendingExports/2026-07',
      expect.objectContaining({ status: 'queued' })
    );
  });

  it('enregistre error_queued si le connector lève une exception', async () => {
    mockNexusGet.mockResolvedValueOnce({ provider: 'silae' });
    mockConnectorSyncPeriod.mockRejectedValueOnce(new Error('API down'));
    mockNexusUpdate.mockResolvedValueOnce(undefined);

    await expect(capturedHandlers['hr.preroll_validated'](basePayload)).rejects.toThrow('API down');

    expect(mockNexusUpdate).toHaveBeenCalledWith(
      'tenants/tenant-rh/hr/pendingExports/2026-07',
      expect.objectContaining({ status: 'error_queued' })
    );
  });
});
