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


describe('anglemorts-batch2a (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

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
});
