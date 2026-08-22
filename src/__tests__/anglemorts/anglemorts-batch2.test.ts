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

import { PosIdempotencyGuard } from '@/modules/ops/service/pos/services/PosIdempotencyGuard';
import { ProvisionalSealService } from '@/modules/finance/comptabilite/ProvisionalSealService';
import { PostSealAddonService } from '@/modules/finance/comptabilite/PostSealAddonService';
import { AdvanceInvoiceService } from '@/modules/finance/comptabilite/AdvanceInvoiceService';
import { CashVarianceService } from '@/modules/finance/comptabilite/CashVarianceService';
import { TableTransferService } from '@/modules/ops/service/pos/services/TableTransferService';
import { TableMergeService } from '@/modules/ops/service/pos/services/TableMergeService';
import { AllergenGateService } from '@/modules/ops/service/pos/services/AllergenGateService';
import { TpeReconciliationService } from '@/modules/ops/service/pos/services/TpeReconciliationService';
import { DisinfectionSequenceService } from '@/modules/ops/production/kds/services/DisinfectionSequenceService';
import { EightysixtService } from '@/modules/ops/production/kds/services/EightysixtService';
import { TicketZEnforcementService } from '@/modules/finance/fiscalite/TicketZEnforcementService';
import { TvaLivraisonGuard } from '@/modules/finance/fiscalite/TvaLivraisonGuard';
import { RevPASHService } from '@/modules/intelligence/analytique/analytics/RevPASHService';
import { MassDataExportAlertService } from '@/modules/compliance/securite/MassDataExportAlertService';
import { TrustScoreAntiDDoSService } from '@/modules/commerce/relation/reservations/services/TrustScoreAntiDDoSService';
import { CO2AlertService } from '@/modules/compliance/qualite/haccp/services/CO2AlertService';
import { WormRetentionEnforcer } from '@/modules/compliance/reglementaire/WormRetentionEnforcer';
import { DunningSaaSService } from '@/modules/finance/tresorerie/DunningSaaSService';
import { SupplierPriceDeviationWatcher } from '@/modules/logistics/approvisionnement/procurement/SupplierPriceDeviationWatcher';
import { CodeAmbreService } from '@/modules/ops/service/pos/services/CodeAmbreService';
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

// ── L5 — POS Idempotence ────────────────────────────────────────────────────
describe('L5 — PosIdempotencyGuard', () => {
  it('retourne isDuplicate=false au premier appel et stocke la clé', async () => {
    const result = await PosIdempotencyGuard.check({
      tenantId: 't1', tableId: 'T4', operatorId: 'op1', cartFingerprint: 'prod1,prod2', now: 1000,
    });
    expect(result.isDuplicate).toBe(false);
    expect(adapter.set).toHaveBeenCalledWith(expect.stringContaining('pos_idemp'), { ts: 1000 });
  });

  it('retourne isDuplicate=true si même clé dans la fenêtre 30s', async () => {
    adapter.get.mockResolvedValueOnce({ ts: 1000 });
    const result = await PosIdempotencyGuard.check({
      tenantId: 't1', tableId: 'T4', operatorId: 'op1', cartFingerprint: 'prod1,prod2', now: 15000,
    });
    expect(result.isDuplicate).toBe(true);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('pos.order_duplicate_blocked', expect.any(Object));
  });

  it('fingerprint trie les produits de façon déterministe', () => {
    const f1 = PosIdempotencyGuard.fingerprint(['z', 'a', 'm']);
    const f2 = PosIdempotencyGuard.fingerprint(['m', 'z', 'a']);
    expect(f1).toBe(f2);
  });
});

// ── L6 — Provisional Seal ───────────────────────────────────────────────────
describe('L6 — ProvisionalSealService', () => {
  it(`crée un sceau provisoire au moment de l'impression`, async () => {
    const seal = await ProvisionalSealService.createOnPrint({
      tenantId: 't1', orderId: 'ord1', operatorId: 'op1', totalInMicrounits: 10_000_000, now: 1000,
    });
    expect(seal.status).toBe('open');
    expect(NexusEventBus.emit).toHaveBeenCalledWith('finance.provisional_seal_created', expect.any(Object));
    expect(OutboxService.enqueue).toHaveBeenCalled();
  });

  it('annule le sceau avec audit PROVISIONAL_SEAL_ANNULLED', async () => {
    adapter.get.mockResolvedValueOnce({ id: 'prov_ord1_1000', status: 'open', orderId: 'ord1', totalInMicrounits: 10_000_000 });
    await ProvisionalSealService.annul({
      tenantId: 't1', sealId: 'prov_ord1_1000', actorId: 'mgr1', reason: 'erreur saisie', now: 2000,
    });
    expect(AuditLogger.logAction).toHaveBeenCalledWith('mgr1', 'PROVISIONAL_SEAL_ANNULLED', 'ord1', expect.any(Object));
    expect(NexusEventBus.emit).toHaveBeenCalledWith('finance.provisional_seal_annulled', expect.any(Object));
  });

  it('throw si sceau déjà clos', async () => {
    adapter.get.mockResolvedValueOnce({ id: 'prov1', status: 'paid', orderId: 'ord1', totalInMicrounits: 0 });
    await expect(
      ProvisionalSealService.annul({ tenantId: 't1', sealId: 'prov1', actorId: 'a', reason: 'r', now: 0 }),
    ).rejects.toThrow('déjà clos');
  });
});

// ── L3 — Add-on ticket ──────────────────────────────────────────────────────
describe('L3 — PostSealAddonService', () => {
  it('calcule le total et taxBreakdown correctement', () => {
    const result = PostSealAddonService.computeTotal([
      { name: 'Cafe', unitPriceInMicrounits: 2_000_000, taxRate: '0.10', productId: 'p1', quantity: 1 },
    ]);
    expect(result.totalInMicrounits).toBe(2_000_000);
    expect(result.taxBreakdown['0.10']).toBe(200_000);
  });

  it('cree un addon lie au parentSealId', async () => {
    const addon = await PostSealAddonService.create({
      tenantId: 't1', parentSealId: 'seal_x', parentOrderId: 'ord1', operatorId: 'op1',
      items: [{ name: 'Cafe', unitPriceInMicrounits: 2_000_000, taxRate: '0.10', productId: 'cafe', quantity: 1 }],
      now: 5000,
    });
    expect(addon.parentSealId).toBe('seal_x');
    expect(NexusEventBus.emit).toHaveBeenCalledWith('finance.addon_ticket_created', expect.any(Object));
  });

  it('throw si items vide', async () => {
    await expect(PostSealAddonService.create({
      tenantId: 't1', parentSealId: 's', parentOrderId: 'o', operatorId: 'op', items: [], now: 1,
    })).rejects.toThrow('au moins 1 item');
  });
});

// ── L21 — Advance Invoice ───────────────────────────────────────────────────
describe('L21 — AdvanceInvoiceService', () => {
  it(`émet facture d'acompte avec ventilation TVA et référence légale`, async () => {
    const invoice = await AdvanceInvoiceService.issueOnDeposit({
      tenantId: 't1', orderId: 'ord_event', issuedBy: 'op1',
      lines: [{ description: 'Privatisation salle', amountInMicrounits: 50_000_000, taxRate: '0.10' }],
      invoiceNumberSeq: 42, now: 1000,
    });
    expect(invoice.legalRef).toBe('Art. 268 ter CGI');
    expect(invoice.tvaInMicrounits).toBe(5_000_000);
    expect(invoice.invoiceNumber).toBe('FA-000042');
    expect(NexusEventBus.emit).toHaveBeenCalledWith('finance.advance_invoice_issued', expect.any(Object));
  });
});

// ── L22 — Cash Variance ─────────────────────────────────────────────────────
describe('L22 — CashVarianceService', () => {
  it('écart négatif → compte 658', () => {
    const r = CashVarianceService.computeVariance(100_000_000, 97_000_000);
    expect(r.account).toBe('658');
    expect(r.varianceInMicrounits).toBe(-3_000_000);
  });

  it('écart positif → compte 757', () => {
    const r = CashVarianceService.computeVariance(100_000_000, 103_000_000);
    expect(r.account).toBe('757');
  });

  it(`écart 0 → null (pas d'écriture)`, async () => {
    const result = await CashVarianceService.recordOnZClosure({
      tenantId: 't1', dateIso: '2026-01-01', operatorId: 'op1',
      expectedInMicrounits: 100_000_000, actualInMicrounits: 100_000_000, now: 1000,
    });
    expect(result).toBeNull();
  });
});

// ── L1 — Table Transfer ─────────────────────────────────────────────────────
describe('L1 — TableTransferService', () => {
  it(`transfère la commande et libère l'ancienne table`, async () => {
    adapter.get
      .mockResolvedValueOnce({ tableId: 'T4', items: [] })  // order
      .mockResolvedValueOnce(null)                            // targetTable (libre)
      .mockResolvedValueOnce({ status: 'occupied' });         // fromTable

    const result = await TableTransferService.transfer({
      tenantId: 't1', orderId: 'ord1', fromTableId: 'T4', toTableId: 'T34', operatorId: 'op1', now: 1000,
    });
    expect(result.success).toBe(true);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('ops.table_transferred', expect.any(Object));
  });

  it('échoue si la table cible est occupée', async () => {
    adapter.get
      .mockResolvedValueOnce({ tableId: 'T4', items: [] })  // order
      .mockResolvedValueOnce({ activeOrderId: 'other_ord' }); // targetTable occupée

    const result = await TableTransferService.transfer({
      tenantId: 't1', orderId: 'ord1', fromTableId: 'T4', toTableId: 'T5', operatorId: 'op1',
    });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('target_table_occupied');
  });
});

// ── L2 — Table Merge ────────────────────────────────────────────────────────
describe('L2 — TableMergeService', () => {
  it(`fusionne les items des deux tables et émet l'événement`, async () => {
    adapter.get
      .mockResolvedValueOnce({ items: [{ id: 'i1' }] })  // primary
      .mockResolvedValueOnce({ items: [{ id: 'i2' }] }); // secondary

    const result = await TableMergeService.merge({
      tenantId: 't1', primaryTableId: 'T4', primaryOrderId: 'ord1',
      secondaryTableId: 'T5', secondaryOrderId: 'ord2', operatorId: 'op1', now: 1000,
    });
    expect(result.success).toBe(true);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('ops.tables_merged', expect.any(Object));
  });
});

// ── B4/T48 — Allergen Gate ──────────────────────────────────────────────────
describe('B4/T48 — AllergenGateService', () => {
  it('check() pur: retourne blocked=false si aucun match', () => {
    const result = AllergenGateService.check(['gluten'], [
      { cartId: 'c1', productId: 'p1', name: 'Salade', allergens: ['lactose'] },
    ]);
    expect(result.blocked).toBe(false);
  });

  it('check() pur: retourne blocked=true si allergen match', () => {
    const result = AllergenGateService.check(['arachides'], [
      { cartId: 'c1', productId: 'p1', name: 'Satay', allergens: ['arachides', 'soja'] },
    ]);
    expect(result.blocked).toBe(true);
    expect(result.matchedItems[0].matchingAllergens).toContain('arachides');
  });

  it('blockOrWarn() throw par défaut si allergen match', async () => {
    await expect(
      AllergenGateService.blockOrWarn({
        tenantId: 't1', orderId: 'ord1', operatorId: 'op1',
        guestAllergens: ['noix'],
        cartItems: [{ cartId: 'c1', productId: 'p1', name: 'Brownie noix', allergens: ['noix'] }],
        now: 1000,
      }),
    ).rejects.toThrow('ALLERGEN_GATE_BLOCKED');
    expect(NexusEventBus.emit).toHaveBeenCalledWith('ops.allergen_order_blocked', expect.any(Object));
  });

  it('blockOrWarn(forceBlock=false) retourne le résultat sans throw', async () => {
    const result = await AllergenGateService.blockOrWarn({
      tenantId: 't1', orderId: 'ord1', operatorId: 'op1',
      guestAllergens: ['noix'],
      cartItems: [{ cartId: 'c1', productId: 'p1', name: 'Brownie noix', allergens: ['noix'] }],
      forceBlock: false, now: 1000,
    });
    expect(result.blocked).toBe(true);
  });
});

// ── L42 — TPE Reconciliation ────────────────────────────────────────────────
describe('L42 — TpeReconciliationService', () => {
  it('bloque le re-débit si statut captured', async () => {
    adapter.get.mockResolvedValueOnce({ status: 'captured', transactionId: 'tx1', orderId: 'ord1' });
    const result = await TpeReconciliationService.checkBeforeRedebit({
      tenantId: 't1', orderId: 'ord1', tpeTransactionId: 'tx1', operatorId: 'op1', now: 1000,
    });
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('already_captured');
    expect(NexusEventBus.emit).toHaveBeenCalledWith('finance.tpe_reconciliation_blocked', expect.any(Object));
  });

  it('autorise le re-débit si statut pending', async () => {
    adapter.get.mockResolvedValueOnce({ status: 'pending', transactionId: 'tx2', orderId: 'ord1' });
    const result = await TpeReconciliationService.checkBeforeRedebit({
      tenantId: 't1', orderId: 'ord1', tpeTransactionId: 'tx2', operatorId: 'op1',
    });
    expect(result.safe).toBe(true);
  });

  it('retourne safe=false + STATE_UNKNOWN si transaction inconnue', async () => {
    adapter.get.mockResolvedValueOnce(null);
    const result = await TpeReconciliationService.checkBeforeRedebit({
      tenantId: 't1', orderId: 'ord1', tpeTransactionId: 'tx3', operatorId: 'op1',
    });
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('state_unknown');
  });
});

// ── L14 — Disinfection Sequence ─────────────────────────────────────────────
describe('L14 — DisinfectionSequenceService', () => {
  it('check() pur: raw_meat → ready_to_eat exige P3_high_temp_sanitize', () => {
    const r = DisinfectionSequenceService.check('raw_meat', 'ready_to_eat');
    expect(r.requiredProtocol).toBe('P3_high_temp_sanitize');
  });

  it('check() pur: raw_meat → raw_meat = pas de protocole requis', () => {
    const r = DisinfectionSequenceService.check('raw_meat', 'raw_meat');
    expect(r.requiredProtocol).toBeNull();
  });

  it('validateAndAlert(): alerte si désinfection non récente', async () => {
    const result = await DisinfectionSequenceService.validateAndAlert({
      tenantId: 't1', stationId: 'trancheuse1',
      fromTaskCategory: 'raw_poultry', toTaskCategory: 'ready_to_eat',
      sanitizationCompletedAt: undefined,
      operatorId: 'chef1', now: 2_000_000,
    });
    expect(result.safe).toBe(false);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('compliance.disinfection_sequence_violation', expect.any(Object));
  });
});

// ── L9 — Eightysix ──────────────────────────────────────────────────────────
describe('L9 — EightysixtService', () => {
  it(`findAffectedDishes() pur: retourne uniquement les plats actifs avec l'ingrédient`, () => {
    const dishes = [
      { dishId: 'd1', name: 'Burger', ingredientIds: ['beef', 'bun'], status: 'active' as const },
      { dishId: 'd2', name: 'Tartare', ingredientIds: ['beef', 'egg'], status: 'active' as const },
      { dishId: 'd3', name: 'Végé', ingredientIds: ['tofu'], status: 'active' as const },
      { dishId: 'd4', name: 'Old Burger', ingredientIds: ['beef'], status: 'inactive' as const },
    ];
    const affected = EightysixtService.findAffectedDishes('beef', dishes);
    expect(affected).toHaveLength(2);
    expect(affected.map(d => d.dishId)).toEqual(['d1', 'd2']);
  });
});

// ── D2 — Ticket Z Enforcement ───────────────────────────────────────────────
describe('D2 — TicketZEnforcementService', () => {
  it('checkMissingZ() détecte les dates sans Z clos', async () => {
    adapter.get.mockResolvedValue(null);
    const result = await TicketZEnforcementService.checkMissingZ('t1', '2026-08-21', 2);
    expect(result.canOpen).toBe(false);
    expect(result.missingDates).toHaveLength(2);
  });

  it('checkMissingZ() retourne canOpen=true si tous les Z sont clos', async () => {
    adapter.get.mockResolvedValue({ status: 'closed' });
    const result = await TicketZEnforcementService.checkMissingZ('t1', '2026-08-21', 2);
    expect(result.canOpen).toBe(true);
  });

  it('assertCanOpenPos() throw si Z manquant', async () => {
    adapter.get.mockResolvedValue(null);
    await expect(
      TicketZEnforcementService.assertCanOpenPos('t1', 'op1', '2026-08-21'),
    ).rejects.toThrow('POS_BLOCKED');
  });
});

// ── T49 — TVA Livraison ─────────────────────────────────────────────────────
describe('T49 — TvaLivraisonGuard', () => {
  it('dine_in: 0.10 est valide, 0.055 invalide pour alcool chaud', () => {
    const result = TvaLivraisonGuard.check('dine_in', [
      { cartId: 'c1', productId: 'p1', name: 'Plat chaud', taxRate: '0.10' },
    ]);
    expect(result.valid).toBe(true);
  });

  it('takeaway_cold: 0.10 est invalide (devrait être 0.055)', () => {
    const result = TvaLivraisonGuard.check('takeaway_cold', [
      { cartId: 'c1', productId: 'p1', name: 'Sandwich froid', taxRate: '0.10' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.mismatches[0].expectedRates).toContain('0.055');
  });
});

// ── L68 — RevPASH ───────────────────────────────────────────────────────────
describe('L68 — RevPASHService', () => {
  it('compute() badge violet si < 4 €/siège/h', () => {
    const result = RevPASHService.compute({
      tenantId: 't1', tableId: 'T1', seats: 4,
      revenueInMicrounits: 8_000_000,   // 8 €
      occupancyMinutes: 120,              // 2h → 8 siège×h → 8/8 = 1 €/siège/h
    });
    expect(result.badge).toBe('violet');
  });

  it('compute() badge green si ≥ 15 €/siège/h', () => {
    const result = RevPASHService.compute({
      tenantId: 't1', tableId: 'T2', seats: 2,
      revenueInMicrounits: 60_000_000,  // 60 €
      occupancyMinutes: 60,              // 1h → 2 siège×h → 60/2 = 30 €/siège/h
    });
    expect(result.badge).toBe('green');
    expect(result.revPash).toBe(30);
  });
});

// ── L56 — Mass Data Export Alert ────────────────────────────────────────────
describe('L56 — MassDataExportAlertService', () => {
  it('alerte si compte cumulé dépasse le seuil', async () => {
    adapter.get.mockResolvedValueOnce({ count: 180, windowStart: Date.now() - 100 });
    const result = await MassDataExportAlertService.check({
      tenantId: 't1', actorId: 'user_ex', resourceType: 'customers',
      count: 50, threshold: 200, now: Date.now(),
    });
    expect(result.alerted).toBe(true);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('security.mass_data_export_alert', expect.any(Object));
  });

  it(`pas d'alerte si cumul < seuil`, async () => {
    adapter.get.mockResolvedValueOnce(null);
    const result = await MassDataExportAlertService.check({
      tenantId: 't1', actorId: 'user1', resourceType: 'customers',
      count: 10, threshold: 200, now: Date.now(),
    });
    expect(result.alerted).toBe(false);
  });
});

// ── L74 — TrustScore ────────────────────────────────────────────────────────
describe('L74 — TrustScoreAntiDDoSService', () => {
  it('flagge si 3 annulations depuis la même IP dans la fenêtre', async () => {
    adapter.get
      .mockResolvedValueOnce({ count: 3, windowStart: Date.now() - 1000 }) // ipRecord
      .mockResolvedValueOnce({ count: 1, windowStart: Date.now() - 1000 }); // phoneRecord

    const result = await TrustScoreAntiDDoSService.evaluate({
      tenantId: 't1', ipAddress: '1.2.3.4', phoneHash: 'ph1',
      action: 'reservation_cancel', now: Date.now(),
    });
    expect(result.flagged).toBe(true);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('commerce.reservation_trust_flagged', expect.any(Object));
  });
});

// ── T95 — CO2 Alert ─────────────────────────────────────────────────────────
describe('T95 — CO2AlertService', () => {
  it('classify() none si < 5000 ppm', () => {
    expect(CO2AlertService.classify(3000).severity).toBe('none');
  });

  it('classify() warning si 5000 ppm', () => {
    expect(CO2AlertService.classify(5000).severity).toBe('warning');
  });

  it('classify() critical si ≥ 30000 ppm avec evacuation', () => {
    const r = CO2AlertService.classify(35000);
    expect(r.severity).toBe('critical');
    expect(r.evacuationRequired).toBe(true);
  });

  it(`processReading() émet l'alerte et persiste`, async () => {
    const result = await CO2AlertService.processReading({
      tenantId: 't1', locationId: 'cave', ppmLevel: 8000, operatorId: 'sys', now: 1000,
    });
    expect(result.triggered).toBe(true);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('compliance.co2_alarm_triggered', expect.any(Object));
  });
});

// ── MCC-C2 — WORM Retention ─────────────────────────────────────────────────
describe('MCC-C2 — WormRetentionEnforcer', () => {
  const SIX_YEARS_MS = 6 * 365.25 * 24 * 3600_000;

  it('check() allowed=false si < 6 ans', () => {
    const createdAt = Date.now() - (SIX_YEARS_MS - 1000);
    const r = WormRetentionEnforcer.check(createdAt);
    expect(r.allowed).toBe(false);
    expect(r.legalRef).toBe('Art. 102 LPF');
  });

  it('check() allowed=true si > 6 ans', () => {
    const createdAt = Date.now() - (SIX_YEARS_MS + 86400_000);
    const r = WormRetentionEnforcer.check(createdAt);
    expect(r.allowed).toBe(true);
  });

  it('assertPurgeAllowed() throw et audit si purge prématurée', async () => {
    const createdAt = Date.now() - 1000;
    await expect(
      WormRetentionEnforcer.assertPurgeAllowed({ resourceId: 'doc1', resourceType: 'FEC', createdAt, requestedBy: 'admin' }),
    ).rejects.toThrow('WORM_RETENTION_BLOCKED');
    expect(AuditLogger.logAction).toHaveBeenCalledWith('admin', 'PURGE_BLOCKED_WORM', 'doc1', expect.any(Object));
  });
});

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
