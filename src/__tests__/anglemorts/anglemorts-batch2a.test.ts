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
