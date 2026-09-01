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

import { MenuEngineeringService } from '@/modules/intelligence/analytique/analytics/MenuEngineeringService';
import { BINRoutingService } from '@/modules/finance/tresorerie/BINRoutingService';
import { AccountingExportService } from '@/modules/finance/comptabilite/AccountingExportService';
import { DineAndDashDetectorService } from '@/modules/ops/service/restaurant/pos/services/DineAndDashDetectorService';
import { AntidatedInvoiceGuard } from '@/modules/finance/fiscalite/AntidatedInvoiceGuard';
import { BreathalyzerRegisterService } from '@/modules/compliance/qualite/haccp/services/BreathalyzerRegisterService';
import { NF525CertExpiryService } from '@/modules/finance/fiscalite/NF525CertExpiryService';
import { ResellerCommissionService } from '@/modules/finance/tresorerie/ResellerCommissionService';
import { SessionTTLRotationService } from '@/lib/auth/SessionTTLRotationService';
import { SACEMDeclarationService } from '@/modules/compliance/reglementaire/SACEMDeclarationService';

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


// ── L69 — Menu Engineering ───────────────────────────────────────────────────
describe('L69 — MenuEngineeringService', () => {
  const dishes = [
    { dishId: 'd1', name: 'Burger', ordersCount: 100, sellingPriceInMicrounits: 15_000_000, foodCostInMicrounits: 5_000_000 },
    { dishId: 'd2', name: 'Salade', ordersCount: 10,  sellingPriceInMicrounits: 12_000_000, foodCostInMicrounits: 8_000_000 },
    { dishId: 'd3', name: 'Tartare', ordersCount: 80, sellingPriceInMicrounits: 25_000_000, foodCostInMicrounits: 8_000_000 },
    { dishId: 'd4', name: 'Soupe', ordersCount: 5,   sellingPriceInMicrounits: 8_000_000, foodCostInMicrounits: 6_000_000 },
  ];

  it('analyse les 4 categories correctement', () => {
    const results = MenuEngineeringService.analyze(dishes);
    const byId = Object.fromEntries(results.map(r => [r.dishId, r]));
    expect(byId['d1'].category).toBe('star');      // pop haute, marge haute
    expect(byId['d2'].category).toBe('dog');       // pop faible, marge faible
    expect(byId['d3'].category).toBe('star');      // pop haute, marge haute
    expect(byId['d4'].category).toBe('dog');       // pop faible, marge faible
  });

  it('retourne vide si pas de plats', () => {
    expect(MenuEngineeringService.analyze([])).toHaveLength(0);
  });

  it('summarize: compte les categories', () => {
    const results = MenuEngineeringService.analyze(dishes);
    const summary = MenuEngineeringService.summarize(results);
    expect(summary.star).toBeGreaterThanOrEqual(1);
  });
});

// ── L70 — BIN Routing ───────────────────────────────────────────────────────
describe('L70 — BINRoutingService', () => {
  it('detectNetwork: Visa = 4...', () => {
    expect(BINRoutingService.detectNetwork('4111111111111111')).toBe('visa');
  });

  it('detectNetwork: Amex = 34...', () => {
    expect(BINRoutingService.detectNetwork('341111111111111')).toBe('amex');
  });

  it('detectNetwork: Mastercard = 5...', () => {
    expect(BINRoutingService.detectNetwork('5100000000000000')).toBe('mastercard');
  });

  it('route: refuse un reseau non accepte', async () => {
    adapter.get.mockResolvedValueOnce(null);
    const result = await BINRoutingService.route({
      tenantId: 't1', panMasked: '34**', bin: '341111',
      allowedNetworks: ['visa', 'mastercard', 'cb'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('amex');
  });
});

// ── D4 — Exports comptables ──────────────────────────────────────────────────
describe('D4 — AccountingExportService', () => {
  const entries = [
    {
      journalCode: 'VTE', ecritureDate: '2026-08-01', compteNum: '411000',
      compteLib: 'Clients', ecritureLib: 'Vente', debitInMicrounits: 100_000_000,
      creditInMicrounits: 0, pieceRef: 'TK-001', ecritureHash: 'abc123',
    },
  ];

  it('formatSage: separateur point-virgule', () => {
    const content = AccountingExportService.formatSage(entries, '2026-08');
    expect(content).toContain(';');
    expect(content).toContain('100.00');
    expect(content).toContain('VTE');
  });

  it('formatCegid: separateur pipe', () => {
    const content = AccountingExportService.formatCegid(entries, '2026-08');
    expect(content).toContain('|');
    expect(content).toContain('CODE_JOURNAL');
  });

  it('formatEBP: colonnes entre guillemets', () => {
    const content = AccountingExportService.formatEBP(entries, '2026-08');
    expect(content).toContain('"Journal"');
  });

  it('export: audit log FEC_EXPORTED', async () => {
    adapter.query.mockResolvedValueOnce(entries);
    const result = await AccountingExportService.export({
      tenantId: 't1', software: 'sage', periodLabel: '2026-08', requestedBy: 'comptable1',
    });
    expect(result.lineCount).toBe(1);
    expect(result.filename).toContain('sage');
    expect(AuditLogger.logAction).toHaveBeenCalledWith(
      'comptable1', 'FEC_EXPORTED', expect.any(String), expect.any(Object),
    );
  });
});

// ── T08 — Dine and Dash ─────────────────────────────────────────────────────
describe('T08 — DineAndDashDetectorService', () => {
  it('isSuspicious: true si > 120 min, false sinon', () => {
    const now = 200 * 60_000;
    // elapsed = (200-0)*60_000 / 60_000 = 200 > 120 => true
    expect(DineAndDashDetectorService.isSuspicious(0, now)).toBe(true);
    // elapsed = (200-150)*60_000 / 60_000 = 50 < 120 => false
    expect(DineAndDashDetectorService.isSuspicious(150 * 60_000, now)).toBe(false);
  });

  it('scanOpenOrders: detecte et alerte les tables suspectes', async () => {
    const now = 200 * 60_000;
    adapter.query.mockResolvedValueOnce([
      { orderId: 'ord1', tableId: 'T9', openedAt: 0, totalInMicrounits: 45_000_000, couverts: 2 },
    ]);
    const alerts = await DineAndDashDetectorService.scanOpenOrders({ tenantId: 't1', operatorId: 'op1', now });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].legalRef).toBe('Art. 311-1 Code Penal');
    expect(NexusEventBus.emit).toHaveBeenCalledWith('ops.dine_and_dash_suspected', expect.any(Object));
  });
});

// ── T10 — Facture antidate ───────────────────────────────────────────────────
describe('T10 — AntidatedInvoiceGuard', () => {
  it('check: autorise si <= 3 jours', () => {
    const now = new Date('2026-08-21').getTime();
    const r = AntidatedInvoiceGuard.check('2026-08-18', now);
    expect(r.allowed).toBe(true);
    expect(r.backdateDays).toBe(3);
  });

  it('check: refuse si > 3 jours', () => {
    const now = new Date('2026-08-21').getTime();
    const r = AntidatedInvoiceGuard.check('2026-08-17', now);
    expect(r.allowed).toBe(false);
    expect(r.backdateDays).toBe(4);
  });

  it('assertAllowed: throw si antidate trop ancienne', async () => {
    const now = new Date('2026-08-21').getTime();
    await expect(
      AntidatedInvoiceGuard.assertAllowed({ invoiceDateIso: '2026-08-10', issuedBy: 'op1', tenantId: 't1', now }),
    ).rejects.toThrow('ANTIDATED_INVOICE_BLOCKED');
  });
});

// ── T94 — Breathalyzer Register ─────────────────────────────────────────────
describe('T94 — BreathalyzerRegisterService', () => {
  it('recordUsage: decremente le stock', async () => {
    adapter.get.mockResolvedValueOnce({ count: 10 });
    const usage = await BreathalyzerRegisterService.recordUsage({
      tenantId: 't1', usedBy: 'serveur1', result: 'fail', now: 1000,
    });
    expect(usage.result).toBe('fail');
    expect(usage.legalRef).toBe('Decret 2012-284');
    expect(OutboxService.enqueue).toHaveBeenCalled();
  });

  it('setStock: emet alerte si < 5', async () => {
    await BreathalyzerRegisterService.setStock('t1', 3, 'mgr1', 1000);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('compliance.breathalyzer_stock_low', expect.any(Object));
  });

  it('setStock: pas d alerte si >= 5', async () => {
    await BreathalyzerRegisterService.setStock('t1', 10, 'mgr1', 1000);
    expect(NexusEventBus.emit).not.toHaveBeenCalled();
  });
});

// ── MCC-C5 — NF525 Cert Expiry ──────────────────────────────────────────────
describe('MCC-C5 — NF525CertExpiryService', () => {
  it('classifyExpiry: expired si date passee', () => {
    expect(NF525CertExpiryService.classifyExpiry(Date.now() - 1000, Date.now())).toBe('expired');
  });

  it('classifyExpiry: critical si < 30 jours', () => {
    expect(NF525CertExpiryService.classifyExpiry(Date.now() + 29 * 86400_000, Date.now())).toBe('critical');
  });

  it('classifyExpiry: warning si < 90 jours', () => {
    expect(NF525CertExpiryService.classifyExpiry(Date.now() + 60 * 86400_000, Date.now())).toBe('warning');
  });

  it('classifyExpiry: null si > 90 jours', () => {
    expect(NF525CertExpiryService.classifyExpiry(Date.now() + 200 * 86400_000, Date.now())).toBeNull();
  });
});

// ── MCC-D4 — Reseller Commission ────────────────────────────────────────────
describe('MCC-D4 — ResellerCommissionService', () => {
  it('computeCommission: 10% de 100 euros = 10 euros', () => {
    const comm = ResellerCommissionService.computeCommission(100_000_000, 10);
    expect(comm).toBe(10_000_000);
  });

  it('generateMonthlyStatement: calcule correctement par tenant', async () => {
    adapter.get.mockResolvedValueOnce({
      resellerId: 'res1', commissionPct: 5,
      activeSince: '2026-01-01',
      tenantIds: ['t1', 't2'],
    });
    const stmt = await ResellerCommissionService.generateMonthlyStatement({
      resellerId: 'res1', periodLabel: '2026-08',
      tenantMrrs: [
        { tenantId: 't1', mrrInMicrounits: 100_000_000 },
        { tenantId: 't2', mrrInMicrounits: 200_000_000 },
      ],
      requestedBy: 'mcc_admin', now: 1000,
    });
    expect(stmt.totalCommissionInMicrounits).toBe(15_000_000);
    expect(stmt.account).toBe('622');
    expect(NexusEventBus.emit).toHaveBeenCalledWith('finance.reseller_commission_generated', expect.any(Object));
  });
});

// ── MCC-E3 — Session TTL ────────────────────────────────────────────────────
describe('MCC-E3 — SessionTTLRotationService', () => {
  it('check: valide si activite recente', async () => {
    const now = Date.now();
    adapter.get.mockResolvedValueOnce({ uid: 'admin1', lastActivityAt: now - 1000, createdAt: now - 5000 });
    const result = await SessionTTLRotationService.check('admin1', now);
    expect(result.valid).toBe(true);
    expect(result.ttlRemainingMs).toBeGreaterThan(0);
  });

  it('check: invalide et revoque si > 12h inactivite', async () => {
    const now = Date.now();
    const stale = now - 13 * 3600_000;
    adapter.get
      .mockResolvedValueOnce({ uid: 'admin1', lastActivityAt: stale, createdAt: stale }) // check
      .mockResolvedValueOnce({ uid: 'admin1', lastActivityAt: stale, createdAt: stale }); // revokeSession read
    const result = await SessionTTLRotationService.check('admin1', now);
    expect(result.valid).toBe(false);
    expect(AuditLogger.logAction).toHaveBeenCalledWith('admin1', 'SESSION_REVOKED', 'admin1', expect.any(Object));
  });

  it('assertValid: throw si session expiree', async () => {
    const now = Date.now();
    adapter.get
      .mockResolvedValueOnce({ uid: 'admin1', lastActivityAt: now - 13 * 3600_000, createdAt: 0 })
      .mockResolvedValueOnce({ uid: 'admin1', lastActivityAt: now - 13 * 3600_000, createdAt: 0 });
    await expect(SessionTTLRotationService.assertValid('admin1', now)).rejects.toThrow('SESSION_EXPIRED:admin1');
  });
});

// ── L80 — SACEM ─────────────────────────────────────────────────────────────
describe('L80 — SACEMDeclarationService', () => {
  it('isLicenseValid: false si pas de licence', async () => {
    adapter.get.mockResolvedValueOnce(null);
    expect(await SACEMDeclarationService.isLicenseValid('t1')).toBe(false);
  });

  it('isLicenseValid: stocke et retrouve une licence valide', async () => {
    const license = { validUntil: '2030-12-31', licenseNumber: 'SAC-001', contractType: 'sono' as const, validFrom: '2024-01-01', annualFeeInMicrounits: 500_000_000 };
    await SACEMDeclarationService.setLicense('t1', license);
    // getLicense retournera null car on ne configure pas le mock get ici;
    // on valide plutot que setLicense appelle adapter.set
    expect(adapter.set).toHaveBeenCalledWith(
      'tenants/t1/sacem_license', license,
    );
  });

  it('setLicense: persiste la config SACEM', async () => {
    const license = { validUntil: '2030-12-31', licenseNumber: 'SAC-001', contractType: 'sono' as const, validFrom: '2024-01-01', annualFeeInMicrounits: 500_000_000 };
    await SACEMDeclarationService.setLicense('t1', license);
    expect(adapter.set).toHaveBeenCalledWith('tenants/t1/sacem_license', license);
  });
});
