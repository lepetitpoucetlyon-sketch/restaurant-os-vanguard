/**
 * Tests angles morts Batch 2 — 35+ services implémentés (2026-08-21).
 *
 * Couvre : L1, L2, L3, L4, L5, L6, L7, L8, L9, L14, L21, L22, L36, L42,
 *          L56, L60, L62, L64, L67, L68, L74, L79, L85, B4, T45, T49, T57,
 *          T59, T68, T95, D1, D2, D3, MCC-C2, MCC-D2, MCC-E1.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { get: vi.fn(), set: vi.fn(), query: vi.fn() } },
}));
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { emit: vi.fn(), emitDurable: vi.fn() },
}));
vi.mock('@/lib/audit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/audit')>();
  return {
    ...actual,
    AuditLogger: { ...actual.AuditLogger, logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
  };
});
vi.mock('@/lib/mcc/audit/AuditLogger', () => ({
  AuditLogger: { logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
}));
vi.mock('@/modules/compliance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/compliance')>();
  return {
    ...actual,
    AuditLogger: { ...actual.AuditLogger, logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
  };
});
vi.mock('@/modules/compliance/securite/AuditLogger', () => ({
  AuditLogger: { logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
}));
vi.mock('@/lib/offline/OutboxService', () => ({
  OutboxService: { enqueue: vi.fn() },
  OutboxPriority: { FISCAL: 1, SANITAIRE: 2, LEGAL: 3, NORMAL: 0 },
}));
vi.mock('@/lib/CryptoService', () => ({
  CryptoService: { generateHash: vi.fn().mockResolvedValue('mock-hash-abc') },
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import { OutboxService } from '@/lib/offline/OutboxService';

import { DunningSaaSService } from '@/modules/finance/tresorerie/DunningSaaSService';
import { SupplierPriceDeviationWatcher } from '@/modules/logistics/approvisionnement/procurement/SupplierPriceDeviationWatcher';
import { CodeAmbreService } from '@/modules/ops/service/restaurant/pos/services/CodeAmbreService';
import { SecondaryDlcLabelService } from '@/modules/logistics/stock/inventory/SecondaryDlcLabelService';
import { RestPeriodGuard } from '@/modules/human/effectifs/hr/services/RestPeriodGuard';
import { AOTTerraceQuotaService } from '@/modules/commerce/relation/reservations/services/AOTTerraceQuotaService';
import { UberEatsWatchdogService } from '@/modules/commerce/acquisition/marketing/UberEatsWatchdogService';

const adapter = Nexus.adapter as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
  adapter.get.mockResolvedValue(null);
  adapter.set.mockResolvedValue(undefined);
  adapter.query.mockResolvedValue([]);
  (NexusEventBus.emit as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (NexusEventBus.emitDurable as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (AuditLogger.logAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (OutboxService.enqueue as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});


describe('anglemorts-batch2b (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

// ── MCC-D2 — Dunning SaaS ───────────────────────────────────────────────────
describe('MCC-D2 — DunningSaaSService', () => {
  it('computeStep() retourne j3 après 3 jours', () => {
    const now = Date.now();
    const duedAt = now - 3 * 86400_000;
    const step = DunningSaaSService.computeStep(duedAt, now);
    expect(step?.step).toBe('j3');
  });

  it('computeStep() retourne j14 après 14 jours', () => {
    const now = Date.now();
    const step = DunningSaaSService.computeStep(now - 14 * 86400_000, now);
    expect(step?.step).toBe('j14');
    expect(step?.action).toBe('service_suspension');
  });

  it('computeStep() retourne null si pas encore overdue', () => {
    const now = Date.now();
    const step = DunningSaaSService.computeStep(now - 1 * 86400_000, now);
    expect(step).toBeNull();
  });

  it('processTenant() ne re-process pas le même step', async () => {
    adapter.get.mockResolvedValueOnce({ lastStep: 'j3' });
    const result = await DunningSaaSService.processTenant({
      invoiceId: 'inv1', tenantId: 't1', tenantEmail: 'a@b.com',
      amountInMicrounits: 100_000_000, dueDateIso: '2026-08-01',
      duedAt: Date.now() - 3 * 86400_000,
    });
    expect(result).toBeNull();
  });
});

// ── T59 — Supplier Price Deviation ──────────────────────────────────────────
describe('T59 — SupplierPriceDeviationWatcher', () => {
  it('alerte si déviation > 5%', async () => {
    adapter.get.mockResolvedValueOnce({ price: 1_000_000, updatedAt: Date.now() - 1000 });
    const result = await SupplierPriceDeviationWatcher.check({
      tenantId: 't1', supplierId: 'sup1', productId: 'beurre',
      newPriceInMicrounits: 1_100_000, // +10%
      checkedBy: 'op1',
    });
    expect(result.alerted).toBe(true);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('logistics.supplier_price_deviation', expect.any(Object));
  });

  it(`pas d'alerte si déviation < 5%`, async () => {
    adapter.get.mockResolvedValueOnce({ price: 1_000_000, updatedAt: Date.now() - 1000 });
    const result = await SupplierPriceDeviationWatcher.check({
      tenantId: 't1', supplierId: 'sup1', productId: 'beurre',
      newPriceInMicrounits: 1_030_000, // +3%
      checkedBy: 'op1',
    });
    expect(result.alerted).toBe(false);
  });
});

// ── L85 — Code Ambre ────────────────────────────────────────────────────────
describe('L85 — CodeAmbreService', () => {
  it(`déclenche le blocage alcool et émet l'événement`, async () => {
    const state = await CodeAmbreService.trigger({
      tenantId: 't1', tableId: 'T3', triggeredBy: 'serveur1', now: 1000,
    });
    expect(state.alcoholBlocked).toBe(true);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('ops.code_ambre_triggered', expect.any(Object));
    expect(AuditLogger.logAction).toHaveBeenCalledWith('serveur1', 'CODE_AMBRE_TRIGGERED', 'T3', expect.any(Object));
  });
});

// ── T57 — Secondary DLC ─────────────────────────────────────────────────────
describe('T57 — SecondaryDlcLabelService', () => {
  it('calcule DLCS = openedAt + 3 jours', () => {
    const openedAt = 0;
    const dlcs = SecondaryDlcLabelService.computeDlcs(openedAt, 3);
    expect(dlcs).toBe(3 * 86400_000);
  });

  it(`enregistre l'ouverture avec Outbox SANITAIRE`, async () => {
    await SecondaryDlcLabelService.recordOpening({
      tenantId: 't1', productId: 'fromage', batchId: 'b1', openedBy: 'chef1', now: 1000,
    });
    expect(OutboxService.enqueue).toHaveBeenCalled();
    expect(NexusEventBus.emit).toHaveBeenCalledWith('logistics.secondary_dlc_label_required', expect.any(Object));
  });
});

// ── L36 — Rest Period Guard ─────────────────────────────────────────────────
describe('L36 — RestPeriodGuard', () => {
  it('check() allowed si repos 12h entre deux shifts', () => {
    const prevEnd = new Date('2026-08-21T06:00:00Z').toISOString();
    const nextStart = new Date('2026-08-21T18:00:00Z').toISOString();
    const r = RestPeriodGuard.check({
      tenantId: 't1', employeeId: 'emp1',
      shiftStartIso: nextStart, shiftEndIso: new Date('2026-08-22T02:00:00Z').toISOString(),
      previousShiftEndIso: prevEnd, createdByManagerId: 'mgr1',
    });
    expect(r.allowed).toBe(true);
  });

  it('check() violation si repos < 11h', () => {
    const prevEnd = new Date('2026-08-21T06:00:00Z').toISOString();
    const nextStart = new Date('2026-08-21T15:00:00Z').toISOString(); // seulement 9h
    const r = RestPeriodGuard.check({
      tenantId: 't1', employeeId: 'emp1',
      shiftStartIso: nextStart, shiftEndIso: new Date('2026-08-21T23:00:00Z').toISOString(),
      previousShiftEndIso: prevEnd, createdByManagerId: 'mgr1',
    });
    expect(r.allowed).toBe(false);
    expect(r.violations[0].type).toBe('insufficient_rest');
  });

  it('assertOrBlock() throw si violation', async () => {
    await expect(RestPeriodGuard.assertOrBlock({
      tenantId: 't1', employeeId: 'emp1',
      shiftStartIso: new Date('2026-08-21T12:00:00Z').toISOString(),
      shiftEndIso: new Date('2026-08-22T02:00:00Z').toISOString(),
      previousShiftEndIso: new Date('2026-08-21T06:00:00Z').toISOString(),
      createdByManagerId: 'mgr1',
    })).rejects.toThrow('REST_PERIOD_VIOLATION');
  });
});

// ── L79 — AOT Terrace Quota ─────────────────────────────────────────────────
describe('L79 — AOTTerraceQuotaService', () => {
  it('refuse le placement si quota AOT dépassé', async () => {
    adapter.get
      .mockResolvedValueOnce({ maxSeats: 30, permitNumber: 'AOT-001', validUntil: '2027-01-01' }) // config
      .mockResolvedValueOnce({ seats: 28 }); // current

    const result = await AOTTerraceQuotaService.checkBeforePlacement({
      tenantId: 't1', seatsToAdd: 5, operatorId: 'op1', now: 1000,
    });
    expect(result.allowed).toBe(false);
    expect(result.excessSeats).toBe(3);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('commerce.aot_terrace_quota_exceeded', expect.any(Object));
  });
});

// ── T45 — Uber Watchdog ──────────────────────────────────────────────────────
describe('T45 — UberEatsWatchdogService', () => {
  it('assess() retourne critical si score < 4.2', () => {
    expect(UberEatsWatchdogService.assess(4.1)).toBe('critical');
  });

  it('assess() retourne warning si 4.2 ≤ score < 4.5', () => {
    expect(UberEatsWatchdogService.assess(4.3)).toBe('warning');
  });

  it('assess() retourne none si ≥ 4.5', () => {
    expect(UberEatsWatchdogService.assess(4.8)).toBe('none');
  });
});
});
