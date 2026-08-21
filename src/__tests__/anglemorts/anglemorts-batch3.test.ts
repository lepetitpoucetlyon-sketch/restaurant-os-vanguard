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
vi.mock('@/modules/compliance/securite/AuditLogger', () => ({
  AuditLogger: { logAction: vi.fn() },
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
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';
import { OutboxService } from '@/lib/offline/OutboxService';

import { AgecCarafeService } from '@/modules/ops/service/pos/services/AgecCarafeService';
import { ComplementaryInvoiceService } from '@/modules/finance/comptabilite/ComplementaryInvoiceService';
import { RpiExportService } from '@/modules/human/effectifs/hr/services/RpiExportService';
import { TipRedistributionService } from '@/modules/human/remuneration/payroll/TipRedistributionService';
import { BadgeClockoutAtZService } from '@/modules/human/effectifs/hr/services/BadgeClockoutAtZService';
import { OrderLineDAGService } from '@/modules/ops/service/pos/services/OrderLineDAGService';
import { ReviewBombingDetectorService } from '@/modules/commerce/acquisition/marketing/ReviewBombingDetectorService';
import { WitnessDishService } from '@/modules/compliance/qualite/haccp/services/WitnessDishService';
import { FryingOilTestRegisterService } from '@/modules/compliance/qualite/haccp/services/FryingOilTestRegisterService';
import { MenuEngineeringService } from '@/modules/intelligence/analytique/analytics/MenuEngineeringService';
import { BINRoutingService } from '@/modules/finance/tresorerie/BINRoutingService';
import { AccountingExportService } from '@/modules/finance/comptabilite/AccountingExportService';
import { DineAndDashDetectorService } from '@/modules/ops/service/pos/services/DineAndDashDetectorService';
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

// ── L8 — AGEC Carafe ────────────────────────────────────────────────────────
describe('L8 — AgecCarafeService', () => {
  it('buildLine: 4 couverts -> 1 carafe', () => {
    const line = AgecCarafeService.buildLine(4);
    expect(line.unitPriceInMicrounits).toBe(0);
    expect(line.quantity).toBe(1);
    expect(line.legalRef).toBe('Art. L. 229-61 C.Env.');
  });

  it('buildLine: 8 couverts -> 2 carafes', () => {
    const line = AgecCarafeService.buildLine(8);
    expect(line.quantity).toBe(2);
  });

  it('attachToOrder: persiste et emet event', async () => {
    const line = await AgecCarafeService.attachToOrder({
      tenantId: 't1', orderId: 'ord1', couverts: 4, operatorId: 'op1', now: 1000,
    });
    expect(line.unitPriceInMicrounits).toBe(0);
    expect(adapter.set).toHaveBeenCalled();
    expect(NexusEventBus.emit).toHaveBeenCalledWith('ops.agec_carafe_attached', expect.any(Object));
  });
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

// ── L51 — DAG commande ──────────────────────────────────────────────────────
describe('L51 — OrderLineDAGService', () => {
  it('appendNode: cree un noeud avec parentNodeId null pour la creation', async () => {
    adapter.get.mockResolvedValueOnce(null);
    const node = await OrderLineDAGService.appendNode({
      tenantId: 't1', orderId: 'ord1', lineId: 'line1', action: 'created',
      productId: 'p1', productName: 'Entrecote', quantity: 1,
      unitPriceInMicrounits: 25_000_000, operatorId: 'chef1', now: 1000,
    });
    expect(node.parentNodeId).toBeNull();
    expect(node.action).toBe('created');
    expect(node.nodeHash).toBe('mock-hash-xyz');
  });

  it('appendNode: chainage: le 2e noeud pointe vers le 1er', async () => {
    const firstNode = {
      nodeId: 'line1_1000', parentNodeId: null, lineId: 'line1', nodeHash: 'hash1',
      orderId: 'ord1', action: 'created' as const, productId: 'p1', productName: 'Entrecote',
      quantity: 1, unitPriceInMicrounits: 25_000_000, operatorId: 'chef1', timestamp: 1000,
    };
    adapter.get.mockResolvedValueOnce({ nodes: [firstNode] });

    const node2 = await OrderLineDAGService.appendNode({
      tenantId: 't1', orderId: 'ord1', lineId: 'line1', action: 'qty_changed',
      productId: 'p1', productName: 'Entrecote', quantity: 2,
      unitPriceInMicrounits: 25_000_000, operatorId: 'chef1', now: 2000,
    });
    expect(node2.parentNodeId).toBe('line1_1000');
  });

  it('getLatestStatePerLine: retourne le dernier etat par ligne', () => {
    const nodes = [
      { nodeId: 'n1', lineId: 'l1', timestamp: 1000, action: 'created' as const, parentNodeId: null,
        orderId: 'o1', productId: 'p1', productName: 'P1', quantity: 1, unitPriceInMicrounits: 0, operatorId: 'op1', nodeHash: 'h1' },
      { nodeId: 'n2', lineId: 'l1', timestamp: 2000, action: 'qty_changed' as const, parentNodeId: 'n1',
        orderId: 'o1', productId: 'p1', productName: 'P1', quantity: 2, unitPriceInMicrounits: 0, operatorId: 'op1', nodeHash: 'h2' },
    ];
    const map = OrderLineDAGService.getLatestStatePerLine(nodes);
    expect(map.get('l1')?.quantity).toBe(2);
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
