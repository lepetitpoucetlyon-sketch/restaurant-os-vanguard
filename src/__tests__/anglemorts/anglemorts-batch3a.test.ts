/**
 * Tests angles morts Batch 3 (2026-08-21).
 * Couvre : L8, L23, L26, L37, L38, L51, L53, L57, L59, L69, L70, L80,
 *          T08, T10, T94, D4, MCC-C5, MCC-D4, MCC-E3.
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
  CryptoService: { generateHash: vi.fn().mockResolvedValue('mock-hash-xyz') },
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import { OutboxService } from '@/lib/offline/OutboxService';

import { ComplementaryInvoiceService } from '@/modules/finance/comptabilite/ComplementaryInvoiceService';
import { RpiExportService } from '@/modules/human/effectifs/hr/services/RpiExportService';
import { TipRedistributionService } from '@/modules/human/remuneration/payroll/TipRedistributionService';
import { BadgeClockoutAtZService } from '@/modules/human/effectifs/hr/services/BadgeClockoutAtZService';
import { ReviewBombingDetectorService } from '@/modules/commerce/acquisition/marketing/ReviewBombingDetectorService';
import { WitnessDishService } from '@/modules/compliance/qualite/haccp/services/WitnessDishService';
import { FryingOilTestRegisterService } from '@/modules/compliance/qualite/haccp/services/FryingOilTestRegisterService';

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
  (AuditLogger.logAction as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (OutboxService.enqueue as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});



// ── L23 — Facture complementaire J+3 ────────────────────────────────────────
describe('L23 — ComplementaryInvoiceService', () => {
  it('cree une facture avec deadline J+3 ouvrables', async () => {
    const inv = await ComplementaryInvoiceService.create({
      tenantId: 't1', originalOrderId: 'ord1', originalSealId: 'seal1',
      customerName: 'SARL Dupont', customerAddress: '12 rue de la Paix, Paris',
      requestedBy: 'op1', now: new Date('2026-08-21T10:00:00Z').getTime(),
    });
    expect(inv.legalRef).toBe('Art. 289 CGI');
    expect(inv.deadlineAt).toBeGreaterThan(inv.issuedAt);
    const days = (inv.deadlineAt - inv.issuedAt) / 86400_000;
    expect(days).toBeGreaterThanOrEqual(3);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('finance.complementary_invoice_created', expect.any(Object));
  });

  it('checkOverdue: marque les factures depassees', async () => {
    const inv = {
      id: 'ci1', status: 'pending' as const, deadlineAt: 1000,
      customerName: 'Test', legalRef: 'Art. 289 CGI', issuedAt: 0,
    };
    adapter.query.mockResolvedValueOnce([inv]);
    const result = await ComplementaryInvoiceService.checkOverdue('t1', 999_999_999);
    expect(result.overdueIds).toContain('ci1');
  });
});

// ── L26 — RPI Export ────────────────────────────────────────────────────────
describe('L26 — RpiExportService', () => {
  it('genere un snapshot signe du registre personnel', async () => {
    adapter.query.mockResolvedValueOnce([
      { employeeId: 'e1', lastName: 'Martin', firstName: 'Paul', nationality: 'FR',
        dateOfBirth: '1990-01-01', jobTitle: 'Serveur', contractType: 'CDI', entryDate: '2023-01-01' },
    ]);
    const snap = await RpiExportService.generateSnapshot({ tenantId: 't1', requestedBy: 'mgr1', now: 1000 });
    expect(snap.employeeCount).toBe(1);
    expect(snap.snapshotHash).toBe('mock-hash-xyz');
    expect(snap.legalRef).toBe('Art. L. 1221-13 CT');
  });
});

// ── L37 — Redistribution pourboires ─────────────────────────────────────────
describe('L37 — TipRedistributionService', () => {
  it('computeShares: repartit proportionnellement', () => {
    const shares = TipRedistributionService.computeShares(10_000_000, [
      { employeeId: 'e1', weight: 1 },
      { employeeId: 'e2', weight: 1 },
    ]);
    expect(shares[0].shareInMicrounits).toBe(5_000_000);
    expect(shares[1].shareInMicrounits).toBe(5_000_000);
  });

  it('computeShares: 0 employees -> vide', () => {
    expect(TipRedistributionService.computeShares(10_000_000, [])).toHaveLength(0);
  });

  it('distribute: vide le pool apres redistribution', async () => {
    adapter.get.mockResolvedValueOnce({ total: 6_000_000, periodLabel: '2026-08' });
    const result = await TipRedistributionService.distribute({
      tenantId: 't1', periodLabel: '2026-08',
      employees: [{ employeeId: 'e1', weight: 1 }],
      authorizedBy: 'mgr1', now: 1000,
    });
    expect(result.totalInMicrounits).toBe(6_000_000);
    expect(result.legalRef).toBe('Loi 2022-1158 art. 1');
    expect(result.lines[0].account).toBe('421');
  });
});

// ── L38 — Badge clockout au Z ────────────────────────────────────────────────
describe('L38 — BadgeClockoutAtZService', () => {
  it('ferme les badges ouverts avec raison ticket_z', async () => {
    adapter.query.mockResolvedValueOnce([
      { id: 'b1', employeeId: 'e1', clockIn: 1000 },
      { id: 'b2', employeeId: 'e2', clockIn: 2000 },
    ]);
    const result = await BadgeClockoutAtZService.runAtZClosure({
      tenantId: 't1', zClosureAt: 999_000, operatorId: 'op1',
    });
    expect(result.closedCount).toBe(2);
    expect(result.closedEmployeeIds).toContain('e1');
    expect(NexusEventBus.emit).toHaveBeenCalledWith('hr.auto_clockout_at_z', expect.any(Object));
  });

  it('ne fait rien si tous les badges sont fermes', async () => {
    adapter.query.mockResolvedValueOnce([
      { id: 'b1', employeeId: 'e1', clockIn: 1000, clockOut: 5000 },
    ]);
    const result = await BadgeClockoutAtZService.runAtZClosure({
      tenantId: 't1', zClosureAt: 999_000, operatorId: 'op1',
    });
    expect(result.closedCount).toBe(0);
  });
});


// ── L53 — Review Bombing ────────────────────────────────────────────────────
describe('L53 — ReviewBombingDetectorService', () => {
  it('analyze: non-suspect si < BURST_THRESHOLD avis negatifs', () => {
    const now = Date.now();
    const reviews = Array.from({ length: 3 }, (_, i) => ({
      reviewId: `r${i}`, platform: 'google' as const,
      rating: 1, publishedAt: now - 1000,
    }));
    const r = ReviewBombingDetectorService.analyze(reviews, 4, now);
    expect(r.isSuspicious).toBe(false);
  });

  it('analyze: suspect si >= 5 avis 1* sans texte dans la fenetre', () => {
    const now = Date.now();
    const reviews = Array.from({ length: 6 }, (_, i) => ({
      reviewId: `r${i}`, platform: 'google' as const,
      rating: 1, publishedAt: now - 1000,
    }));
    const r = ReviewBombingDetectorService.analyze(reviews, 4, now);
    expect(r.isSuspicious).toBe(true);
    expect(r.noTextRatio).toBe(1);
  });
});

// ── L57 — Plat temoin banquet ────────────────────────────────────────────────
describe('L57 — WitnessDishService', () => {
  it('isBanquet: vrai si > 30 couverts', () => {
    expect(WitnessDishService.isBanquet(31)).toBe(true);
    expect(WitnessDishService.isBanquet(30)).toBe(false);
  });

  it('createChecklist: null si pas un banquet', async () => {
    const result = await WitnessDishService.createChecklist({
      tenantId: 't1', reservationId: 'r1', couverts: 20,
      dishes: ['Poulet'], operatorId: 'chef1',
    });
    expect(result).toBeNull();
  });

  it('createChecklist: cree la checklist 72h pour un banquet', async () => {
    const now = 0;
    const record = await WitnessDishService.createChecklist({
      tenantId: 't1', reservationId: 'r1', couverts: 35,
      dishes: ['Entree', 'Plat', 'Dessert'], operatorId: 'chef1', now,
    });
    expect(record).not.toBeNull();
    expect(record!.retainUntil).toBe(72 * 3600_000);
    expect(record!.legalRef).toBe('CE 852/2004 Annexe II Ch.IX §5');
  });

  it('markDestroyed: throw si on essaie de detruire avant 72h', async () => {
    adapter.get.mockResolvedValueOnce({
      id: 'wd1', retainUntil: 999_999_999, tenantId: 't1',
      reservationId: 'r1', couverts: 35, dishes: [], collectedAt: 0,
      legalRef: 'CE 852/2004 Annexe II Ch.IX §5',
    });
    await expect(WitnessDishService.markDestroyed('t1', 'wd1', 'chef1', 1000))
      .rejects.toThrow('WITNESS_DISH_PREMATURE_DESTROY');
  });
});

// ── L59 — Test huile friture ─────────────────────────────────────────────────
describe('L59 — FryingOilTestRegisterService', () => {
  it('isPassed: false si >= 25%', () => {
    expect(FryingOilTestRegisterService.isPassed(25)).toBe(false);
    expect(FryingOilTestRegisterService.isPassed(24.9)).toBe(true);
  });

  it('recordTest: bloque la station si depasse', async () => {
    const record = await FryingOilTestRegisterService.recordTest({
      tenantId: 't1', stationId: 'friteuse1', testedBy: 'chef1',
      polarCompoundsPct: 28, now: 1000,
    });
    expect(record.passed).toBe(false);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('compliance.frying_oil_threshold_exceeded', expect.any(Object));
    expect(adapter.set).toHaveBeenCalledWith(
      'tenants/t1/frying_stations/friteuse1',
      expect.objectContaining({ blocked: true }),
    );
  });

  it('recordTest: debloque la station si valide', async () => {
    await FryingOilTestRegisterService.recordTest({
      tenantId: 't1', stationId: 'friteuse1', testedBy: 'chef1',
      polarCompoundsPct: 20, now: 1000,
    });
    expect(adapter.set).toHaveBeenCalledWith(
      'tenants/t1/frying_stations/friteuse1',
      expect.objectContaining({ blocked: false }),
    );
  });
});
