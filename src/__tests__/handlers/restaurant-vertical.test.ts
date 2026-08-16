/**
 * RestaurantVertical — tests unitaires
 * Couvre : initialisation, handlers d'événements, adapters, RBAC.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── vi.hoisted — variables accessibles dans les factories hoistées ─────────────
const mocks = vi.hoisted(() => ({
  emit:                    vi.fn().mockResolvedValue(undefined),
  on:                      vi.fn((_e: string, h: (...a: unknown[]) => unknown) => () => h),
  nexusSet:                vi.fn().mockResolvedValue(undefined),
  nexusUpdate:             vi.fn().mockResolvedValue(undefined),
  emitOrderFiscalSeal:     vi.fn(),
  emitSalesDataReady:      vi.fn(),
  emitTableLayoutChanged:  vi.fn(),
  emitMaintenanceRequired: vi.fn(),
  emitHealthPing:          vi.fn(),
  emitFiscalAuditRequired: vi.fn(),
  computeReport: vi.fn().mockResolvedValue({
    periodStart: '2026-01-01T00:00:00.000Z',
    periodEnd:   '2026-01-31T00:00:00.000Z',
    items:       [{ id: 'item-1' }, { id: 'item-2' }],
    avgContributionMarginInMicrounits: 5_000_000,
    avgPopularityIndex: 0.75,
  }),
}));

// ── Mocks globaux ─────────────────────────────────────────────────────────────

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      get:    vi.fn(),
      set:    mocks.nexusSet,
      update: mocks.nexusUpdate,
      query:  vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: {
    on:          mocks.on,
    emit:        mocks.emit,
    emitDurable: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));

vi.mock('@/modules/commerce', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    menuEngineeringService: { computeReport: mocks.computeReport },
  };
});

vi.mock('@/verticals/restaurant/adapters', () => ({
  RestaurantFinanceAdapter:     { emitOrderFiscalSeal:     mocks.emitOrderFiscalSeal },
  RestaurantIntelligenceAdapter:{ emitSalesDataReady:      mocks.emitSalesDataReady  },
  RestaurantComplianceAdapter:  { emitHaccpAlert:          vi.fn() },
  RestaurantLogisticsAdapter:   { emitStockDeducted:       vi.fn() },
  RestaurantFacilityAdapter:    {
    emitTableLayoutChanged:  mocks.emitTableLayoutChanged,
    emitMaintenanceRequired: mocks.emitMaintenanceRequired,
  },
  RestaurantMccAdapter: {
    emitHealthPing:          mocks.emitHealthPing,
    emitFiscalAuditRequired: mocks.emitFiscalAuditRequired,
  },
}));

vi.mock('@/modules/facility/spaces/floor-plan', () => ({ FloorPlanPage: () => null }));
vi.mock('@/modules/finance/comptabilite/fec', () => ({ FECExportPage: () => null }));
vi.mock('@/verticals/restaurant/presentation/MenuEngineeringDashboard', () => ({ MenuEngineeringDashboard: () => null }));

// ── Imports après mocks ───────────────────────────────────────────────────────

import { RestaurantVertical } from '@/verticals/restaurant/RestaurantVertical';

// ── Context mock ──────────────────────────────────────────────────────────────

const registeredHandlers: Record<string, ((...args: unknown[]) => unknown)[]> = {};

const ctxMock = {
  registerRoute:        vi.fn(),
  registerAtom:         vi.fn(),
  registerStoreAtom:    vi.fn(),
  registerRbacConfig:   vi.fn(),
  getRegisteredRoutes:  vi.fn(() => []),
  getRegisteredAtoms:   vi.fn(() => []),
  registerEventHandler: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
    if (!registeredHandlers[event]) registeredHandlers[event] = [];
    registeredHandlers[event].push(handler);
  }),
};

async function fireEvent(event: string, payload: unknown) {
  for (const h of registeredHandlers[event] ?? []) {
    await (h as (p: unknown) => Promise<void>)(payload);
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

let vertical: RestaurantVertical;

beforeEach(async () => {
  vi.clearAllMocks();
  Object.keys(registeredHandlers).forEach(k => delete registeredHandlers[k]);
  vertical = new RestaurantVertical();
  await vertical.initialize(ctxMock as never);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RestaurantVertical — meta', () => {
  it('expose les bonnes métadonnées', () => {
    expect(vertical.id).toBe('restaurant');
    expect(vertical.version).toBe('1.0.0');
  });
});

describe('RestaurantVertical — initialisation', () => {
  it('enregistre les 3 routes', () => {
    const paths = ctxMock.registerRoute.mock.calls.map((c: unknown[]) => c[0]);
    expect(paths).toContain('/menu-engineering');
    expect(paths).toContain('/floor-plan');
    expect(paths).toContain('/nf525');
  });

  it('appelle registerRbacConfig avec les permissions par défaut', () => {
    expect(ctxMock.registerRbacConfig).toHaveBeenCalledOnce();
    const config = ctxMock.registerRbacConfig.mock.calls[0][0] as Record<string, unknown>;
    expect(config.version).toBe(1);
    expect(config.pageOverrides).toBeDefined();
    expect(Object.keys(config.pageOverrides as object).length).toBeGreaterThan(0);
  });

  it('enregistre les handlers pour tous les events critiques', () => {
    const events = Object.keys(registeredHandlers);
    expect(events).toContain('ops.order_notification');
    expect(events).toContain('table.released');
    expect(events).toContain('reservation.confirmed');
    expect(events).toContain('reservation.no_show');
    expect(events).toContain('sensor.temperature_anomaly');
    expect(events).toContain('dlc.expired');
    expect(events).toContain('intelligence.menu_engineering_requested');
    expect(events).toContain('tenant.ready');
  });
});

describe('RestaurantVertical — ops.order_notification', () => {
  it('émet le seal fiscal et les données sales', async () => {
    await fireEvent('ops.order_notification', {
      tenantId: 'tenant-1', orderId: 'ord-1', totalInMicrounits: 10_000_000,
    });
    expect(mocks.emitOrderFiscalSeal).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', orderId: 'ord-1', totalInMicrounits: 10_000_000 }),
    );
    expect(mocks.emitSalesDataReady).toHaveBeenCalled();
  });
});

describe('RestaurantVertical — table.released', () => {
  it('appelle emitTableLayoutChanged avec floorId main et tables[]', async () => {
    await fireEvent('table.released', { tenantId: 'tenant-1', tableId: 'tbl-5' });
    expect(mocks.emitTableLayoutChanged).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      floorId:  'main',
      tables:   [{ id: 'tbl-5', capacity: 0, x: 0, y: 0 }],
    });
  });
});

describe('RestaurantVertical — reservation.confirmed', () => {
  it('émet notification.created vers le bus', async () => {
    await fireEvent('reservation.confirmed', {
      tenantId: 'tenant-1', reservationId: 'resa-1',
      customerName: 'Alice', covers: 4, date: '2026-02-01', time: '20:00',
    });
    expect(mocks.emit).toHaveBeenCalledWith('notification.created', expect.objectContaining({
      tenantId: 'tenant-1',
      title: 'Réservation confirmée',
    }));
  });
});

describe('RestaurantVertical — reservation.no_show', () => {
  it('émet crm.rfm_trigger si customerId présent', async () => {
    await fireEvent('reservation.no_show', {
      tenantId: 'tenant-1', reservationId: 'resa-2', customerId: 'cust-9',
    });
    expect(mocks.emit).toHaveBeenCalledWith('crm.rfm_trigger', {
      tenantId: 'tenant-1', customerId: 'cust-9',
    });
  });

  it('n\'émet rien si customerId absent', async () => {
    await fireEvent('reservation.no_show', {
      tenantId: 'tenant-1', reservationId: 'resa-3',
    });
    expect(mocks.emit).not.toHaveBeenCalled();
  });
});

describe('RestaurantVertical — sensor.temperature_anomaly', () => {
  it('émet haccp.alert HIGH pour anomalie courte', async () => {
    await fireEvent('sensor.temperature_anomaly', {
      v: 1, tenantId: 'tenant-1', sensorId: 'sens-1', temperature: 10, durationInMinutes: 5,
    });
    expect(mocks.emit).toHaveBeenCalledWith('haccp.alert', expect.objectContaining({
      severity: 'HIGH',
    }));
    expect(mocks.emitFiscalAuditRequired).not.toHaveBeenCalled();
  });

  it('émet haccp.alert CRITICAL et MCC audit si durée > 30 min', async () => {
    await fireEvent('sensor.temperature_anomaly', {
      v: 1, tenantId: 'tenant-1', sensorId: 'sens-1', temperature: 12, durationInMinutes: 45,
    });
    expect(mocks.emit).toHaveBeenCalledWith('haccp.alert', expect.objectContaining({
      severity: 'CRITICAL',
    }));
    expect(mocks.emitFiscalAuditRequired).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', urgency: 'high' }),
    );
  });
});

describe('RestaurantVertical — dlc.expired', () => {
  it('émet notification.created de type alert', async () => {
    await fireEvent('dlc.expired', {
      v: 1, tenantId: 'tenant-1', itemId: 'item-x', quantity: 3, batchNumber: 'BN-001',
    });
    expect(mocks.emit).toHaveBeenCalledWith('notification.created', expect.objectContaining({
      type: 'alert',
      title: 'DLC expiré',
    }));
  });
});

describe('RestaurantVertical — intelligence.menu_engineering_requested', () => {
  it('appelle computeReport et propage via emitSalesDataReady', async () => {
    await fireEvent('intelligence.menu_engineering_requested', {
      tenantId: 'tenant-1', periodDays: 30,
    });
    expect(mocks.computeReport).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1' }),
    );
    expect(mocks.emitSalesDataReady).toHaveBeenCalled();
  });
});

describe('RestaurantVertical — tenant.ready', () => {
  it('émet un health ping MCC', async () => {
    await fireEvent('tenant.ready', { tenantId: 'tenant-1' });
    expect(mocks.emitHealthPing).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', status: 'healthy' }),
    );
  });
});

describe('RestaurantVertical — destroy', () => {
  it('se termine sans erreur', async () => {
    await expect(vertical.destroy()).resolves.toBeUndefined();
  });
});
