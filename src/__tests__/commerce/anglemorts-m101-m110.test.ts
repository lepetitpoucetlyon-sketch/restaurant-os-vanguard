/**
 * Tests des M-items critiques du doc anglemort (section 4).
 * Couverture ciblée sur les logiques pures — le wiring Nexus est mocké.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mocks Nexus + EventBus + AuditLogger + Outbox ───────────────────────────
const nexusStore = new Map<string, unknown>();
const emittedEvents: Array<{ name: string; payload: unknown }> = [];
const auditLogs: Array<{ action: string; targetId: string; metadata?: unknown }> = [];
const outboxEnqueued: Array<{ collection: string; targetId: string; priority?: number }> = [];

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      get: vi.fn(async (path: string) => nexusStore.get(path) ?? null),
      set: vi.fn(async (path: string, val: unknown) => { nexusStore.set(path, val); }),
      delete: vi.fn(async (path: string) => { nexusStore.delete(path); }),
      update: vi.fn(async (path: string, patch: Record<string, unknown>) => {
        const cur = (nexusStore.get(path) as Record<string, unknown>) || {};
        nexusStore.set(path, { ...cur, ...patch });
      }),
    },
  },
}));

vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: {
    emit: vi.fn(async (name: string, payload: unknown) => {
      emittedEvents.push({ name, payload });
    }),
  },
}));

vi.mock('@/lib/audit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/audit')>();
  return {
    ...actual,
    AuditLogger: {
      ...actual.AuditLogger,
      logAction: vi.fn(async (_admin: string, action: string, targetId: string, metadata?: unknown) => {
        auditLogs.push({ action, targetId, metadata });
        return { id: 'log_1' };
      }),
    },
  };
});
vi.mock('@/lib/mcc/audit/AuditLogger', () => ({
  AuditLogger: {
    logAction: vi.fn(async (_admin: string, action: string, targetId: string, metadata?: unknown) => {
      auditLogs.push({ action, targetId, metadata });
      return { id: 'log_1' };
    }),
  },
}));
vi.mock('@/modules/compliance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/compliance')>();
  return {
    ...actual,
    AuditLogger: {
      ...actual.AuditLogger,
      logAction: vi.fn(async (_admin: string, action: string, targetId: string, metadata?: unknown) => {
        auditLogs.push({ action, targetId, metadata });
        return { id: 'log_1' };
      }),
    },
  };
});
vi.mock('@/modules/compliance/securite/AuditLogger', () => ({
  AuditLogger: {
    logAction: vi.fn(async (_admin: string, action: string, targetId: string, metadata?: unknown) => {
      auditLogs.push({ action, targetId, metadata });
      return { id: 'log_1' };
    }),
  },
}));

vi.mock('@/lib/offline/OutboxService', () => ({
  OutboxPriority: { NORMAL: 0, FISCAL: 1, SANITAIRE: 2, LEGAL: 3 },
  OutboxService: {
    enqueue: vi.fn(async (params: { collection: string; targetId: string; priority?: number }) => {
      outboxEnqueued.push(params);
      return 1;
    }),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Reset entre tests
beforeEach(() => {
  nexusStore.clear();
  emittedEvents.length = 0;
  auditLogs.length = 0;
  outboxEnqueued.length = 0;
});

// ── M104 — CAS Slot Lock ────────────────────────────────────────────────────
describe('M104 — ReservationSlotLockService', () => {
  it('acquire réussit sur créneau libre + émet commerce.table_lock_acquired', async () => {
    const { ReservationSlotLockService } = await import(
      '@/modules/commerce/relation/reservations/services/ReservationSlotLockService'
    );
    const r = await ReservationSlotLockService.acquire('t1', 'T4', '2026-09-01T19:00:00Z', 'widget_web', 'r1', 5, 1000);
    expect(r.success).toBe(true);
    expect(r.lock?.holder).toBe('widget_web');
    expect(emittedEvents[0].name).toBe('commerce.table_lock_acquired');
  });

  it('acquire concurrent (Google Reserve après widget_web) échoue avec SLOT_ALREADY_LOCKED', async () => {
    const { ReservationSlotLockService } = await import(
      '@/modules/commerce/relation/reservations/services/ReservationSlotLockService'
    );
    await ReservationSlotLockService.acquire('t1', 'T4', '2026-09-01T19:00:00Z', 'widget_web', 'r1', 5, 1000);
    const second = await ReservationSlotLockService.acquire('t1', 'T4', '2026-09-01T19:00:00Z', 'google_reserve', 'r2', 5, 1500);
    expect(second.success).toBe(false);
    expect(second.error).toBe('SLOT_ALREADY_LOCKED');
    expect(second.conflict?.holder).toBe('widget_web');
  });

  it('renouvellement idempotent : même holder + même reservationId', async () => {
    const { ReservationSlotLockService } = await import(
      '@/modules/commerce/relation/reservations/services/ReservationSlotLockService'
    );
    const first = await ReservationSlotLockService.acquire('t1', 'T4', 'slot', 'widget_web', 'r1', 5, 1000);
    const renew = await ReservationSlotLockService.acquire('t1', 'T4', 'slot', 'widget_web', 'r1', 5, 1500);
    expect(renew.success).toBe(true);
    expect(renew.lock?.version).toBe((first.lock?.version ?? 0) + 1);
  });

  it('lock expiré → un nouvel acquéreur peut prendre la place', async () => {
    const { ReservationSlotLockService } = await import(
      '@/modules/commerce/relation/reservations/services/ReservationSlotLockService'
    );
    await ReservationSlotLockService.acquire('t1', 'T4', 'slot', 'widget_web', 'r1', 1, 1000);
    // 2 min plus tard, TTL 1 min → expiré
    const second = await ReservationSlotLockService.acquire('t1', 'T4', 'slot', 'google_reserve', 'r2', 5, 1000 + 120_000);
    expect(second.success).toBe(true);
    expect(second.lock?.holder).toBe('google_reserve');
  });
});

// ── M106 — HMAC Cancel Link ─────────────────────────────────────────────────
describe('M106 — CancelLinkTokenService', () => {
  const secret = 'x'.repeat(64);
  beforeEach(() => { process.env.RESERVATION_CANCEL_HMAC_SECRET = secret; });

  it('generate + verify roundtrip', async () => {
    const { CancelLinkTokenService } = await import(
      '@/modules/commerce/relation/reservations/services/CancelLinkTokenService'
    );
    const token = CancelLinkTokenService.generate('res_123', 24, undefined, 1000);
    const result = await CancelLinkTokenService.verify(token, { now: 2000 });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.payload.r).toBe('res_123');
  });

  it('token forgé (signature altérée) rejeté avec invalid_hmac', async () => {
    const { CancelLinkTokenService } = await import(
      '@/modules/commerce/relation/reservations/services/CancelLinkTokenService'
    );
    const token = CancelLinkTokenService.generate('res_123', 24, undefined, 1000);
    const tampered = token.slice(0, -3) + 'AAA';
    const result = await CancelLinkTokenService.verify(tampered, { now: 2000, tenantId: 't1' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('invalid_hmac');
    expect(emittedEvents.some(e => e.name === 'security.unauthorized_access_attempt')).toBe(true);
  });

  it('token expiré rejeté', async () => {
    const { CancelLinkTokenService } = await import(
      '@/modules/commerce/relation/reservations/services/CancelLinkTokenService'
    );
    const token = CancelLinkTokenService.generate('res_123', 1, undefined, 1000);
    // now = 1000 + 2h → expiré
    const result = await CancelLinkTokenService.verify(token, { now: 1000 + 2 * 3600 * 1000 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('expired_token');
  });

  it('phone last-digits mismatch → phone_mismatch', async () => {
    const { CancelLinkTokenService } = await import(
      '@/modules/commerce/relation/reservations/services/CancelLinkTokenService'
    );
    const token = CancelLinkTokenService.generate('res_123', 24, '1234', 1000);
    const result = await CancelLinkTokenService.verify(token, { now: 2000, requirePhoneLastDigits: '5678' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('phone_mismatch');
  });

  it('malformed rejeté', async () => {
    const { CancelLinkTokenService } = await import(
      '@/modules/commerce/relation/reservations/services/CancelLinkTokenService'
    );
    const result = await CancelLinkTokenService.verify('no_dot_here', { tenantId: 't1' });
    expect(result.valid).toBe(false);
  });

  it('secret trop court → throw', async () => {
    process.env.RESERVATION_CANCEL_HMAC_SECRET = 'short';
    const { CancelLinkTokenService } = await import(
      '@/modules/commerce/relation/reservations/services/CancelLinkTokenService'
    );
    expect(() => CancelLinkTokenService.generate('r', 24)).toThrow();
  });
});

// ── M109 — GiftCard Lock ────────────────────────────────────────────────────
describe('M109 — GiftCardLockService', () => {
  it('acquire réussit puis conflit sur second appel', async () => {
    const { GiftCardLockService } = await import(
      '@/modules/commerce/fidelite/loyalty/services/GiftCardLockService'
    );
    const a = await GiftCardLockService.acquire('t1', 'gc_1', 'pos', 100_000_000, 'ord_1', 90_000, 1000);
    expect(a.success).toBe(true);
    const b = await GiftCardLockService.acquire('t1', 'gc_1', 'web', 100_000_000, 'ord_2', 90_000, 1500);
    expect(b.success).toBe(false);
    expect(b.error).toBe('ALREADY_LOCKED');
    expect(b.conflict?.lockedBy).toBe('pos');
  });

  it('release débloque puis un autre canal peut acquérir', async () => {
    const { GiftCardLockService } = await import(
      '@/modules/commerce/fidelite/loyalty/services/GiftCardLockService'
    );
    await GiftCardLockService.acquire('t1', 'gc_1', 'pos', 50_000_000, 'ord_1', 90_000, 1000);
    await GiftCardLockService.release('t1', 'gc_1');
    const b = await GiftCardLockService.acquire('t1', 'gc_1', 'web', 50_000_000, 'ord_2', 90_000, 2000);
    expect(b.success).toBe(true);
    expect(b.lock?.lockedBy).toBe('web');
  });

  it('event finance.giftcard_locked émis', async () => {
    const { GiftCardLockService } = await import(
      '@/modules/commerce/fidelite/loyalty/services/GiftCardLockService'
    );
    await GiftCardLockService.acquire('t1', 'gc_1', 'pos', 50_000_000, 'ord_1', 90_000, 1000);
    expect(emittedEvents[0].name).toBe('finance.giftcard_locked');
  });
});

// ── M110 — Late Allergen Interception ───────────────────────────────────────
describe('M110 — LateAllergenInterceptionService', () => {
  it('computeImpact détecte les items avec allergène', async () => {
    const { LateAllergenInterceptionService } = await import(
      '@/modules/ops/production/kds/services/LateAllergenInterceptionService'
    );
    const r = LateAllergenInterceptionService.computeImpact({
      tenantId: 't1',
      orderId: 'ord_1',
      operatorId: 'op_1',
      newAllergens: ['arachide'],
      items: [
        { id: 'i1', productId: 'p1', name: 'Pad Thai', allergens: ['arachide', 'gluten'], status: 'cooking' },
        { id: 'i2', productId: 'p2', name: 'Sorbet', allergens: [], status: 'plated' },
      ],
      changedAt: 1000,
      reservationTimeMs: 1000 + 15 * 60_000,
    });
    expect(r.intercepted).toBe(true);
    expect(r.impactedItemIds).toEqual(['i1']);
    expect(r.minutesBeforeArrival).toBe(15);
  });

  it('items tous served → intercepted=false, reason=ALL_SERVED', async () => {
    const { LateAllergenInterceptionService } = await import(
      '@/modules/ops/production/kds/services/LateAllergenInterceptionService'
    );
    const r = LateAllergenInterceptionService.computeImpact({
      tenantId: 't1', orderId: 'o', operatorId: 'op',
      newAllergens: ['gluten'],
      items: [{ id: 'i1', productId: 'p', name: 'Pain', allergens: ['gluten'], status: 'served' }],
      changedAt: 1000, reservationTimeMs: 2000,
    });
    expect(r.intercepted).toBe(false);
    expect(r.reason).toBe('ALL_SERVED');
    expect(r.impactedItemIds).toEqual(['i1']);
  });

  it('intercept() émet event + outbox SANITAIRE + audit ALLERGEN_ORDER_BLOCKED', async () => {
    const { LateAllergenInterceptionService } = await import(
      '@/modules/ops/production/kds/services/LateAllergenInterceptionService'
    );
    await LateAllergenInterceptionService.intercept({
      tenantId: 't1',
      orderId: 'ord_1',
      operatorId: 'op_1',
      newAllergens: ['arachide'],
      items: [
        { id: 'i1', productId: 'p1', name: 'Pad Thai', allergens: ['arachide'], status: 'cooking' },
      ],
      changedAt: 1000,
      reservationTimeMs: 1000 + 15 * 60_000,
    });

    expect(emittedEvents.some(e => e.name === 'kds.critical_allergen_interception')).toBe(true);
    expect(outboxEnqueued[0].priority).toBe(2); // SANITAIRE
    expect(outboxEnqueued[0].collection).toContain('haccp_incidents');
    expect(auditLogs[0].action).toBe('ALLERGEN_ORDER_BLOCKED');
  });
});

// ── M105 — SMS Sanitizer ────────────────────────────────────────────────────
describe('M105 — SmsSanitizerService', () => {
  it('analyze texte pure ASCII → GSM-7 / 1 segment', async () => {
    const { SmsSanitizerService } = await import(
      '@/modules/ops/service/notifications/SmsSanitizerService'
    );
    const r = SmsSanitizerService.analyze('Bonjour votre table est prete');
    expect(r.encoding).toBe('GSM-7');
    expect(r.segments).toBe(1);
    expect(r.strippedChars).toEqual([]);
  });

  it('texte avec emoji → UCS-2 + emoji strippé du sanitized', async () => {
    const { SmsSanitizerService } = await import(
      '@/modules/ops/service/notifications/SmsSanitizerService'
    );
    const r = SmsSanitizerService.analyze('Table prete 🎉');
    expect(r.encoding).toBe('UCS-2');
    expect(r.strippedChars.length).toBeGreaterThan(0);
  });

  it('isValidE164 accepte +33612345678 et rejette 0612345678', async () => {
    const { SmsSanitizerService } = await import(
      '@/modules/ops/service/notifications/SmsSanitizerService'
    );
    expect(SmsSanitizerService.isValidE164('+33612345678')).toBe(true);
    expect(SmsSanitizerService.isValidE164('0612345678')).toBe(false);
    expect(SmsSanitizerService.isValidE164('+0123')).toBe(false);
  });

  it('warnIfSegmentBudget émet event si dépasse maxSegments', async () => {
    const { SmsSanitizerService } = await import(
      '@/modules/ops/service/notifications/SmsSanitizerService'
    );
    await SmsSanitizerService.warnIfSegmentBudget('t1', '+33612345678', 'x'.repeat(500), 2);
    expect(emittedEvents.some(e => e.name === 'system.sms_segment_warning')).toBe(true);
  });
});

// ── M102 — Table Split ──────────────────────────────────────────────────────
describe('M102 — TableSplitService.computeSplit', () => {
  it('grace period actif → pas de split', async () => {
    const { TableSplitService } = await import(
      '@/modules/commerce/relation/reservations/services/TableSplitService'
    );
    const r = TableSplitService.computeSplit(
      { originalPartySize: 8, actualArrivedPartySize: 3, gracePeriodMinutes: 10, checkedInAt: 60_000 },
      60_000 + 5 * 60_000,
    );
    expect(r.applied).toBe(false);
    expect(r.reason).toBe('GRACE_PERIOD_ACTIVE');
  });

  it('après grace period → libère les sièges', async () => {
    const { TableSplitService } = await import(
      '@/modules/commerce/relation/reservations/services/TableSplitService'
    );
    const r = TableSplitService.computeSplit(
      { originalPartySize: 8, actualArrivedPartySize: 3, gracePeriodMinutes: 10, checkedInAt: 0 },
      11 * 60_000,
    );
    expect(r.applied).toBe(true);
    expect(r.freedSeats).toBe(5);
  });

  it('groupe complet arrivé → pas de split', async () => {
    const { TableSplitService } = await import(
      '@/modules/commerce/relation/reservations/services/TableSplitService'
    );
    const r = TableSplitService.computeSplit(
      { originalPartySize: 4, actualArrivedPartySize: 4, checkedInAt: 0 },
      999_999,
    );
    expect(r.applied).toBe(false);
    expect(r.reason).toBe('FULL_PARTY_ARRIVED');
  });
});

// ── M108 — Turnover ─────────────────────────────────────────────────────────
describe('M108 — TurnoverPredictionService.predict', () => {
  it('dégustation 4 personnes 19h30 → collision avec créneau 21h30', async () => {
    const { TurnoverPredictionService } = await import(
      '@/modules/commerce/relation/reservations/services/TurnoverPredictionService'
    );
    const startMs = new Date('2026-09-01T19:30:00Z').getTime();
    const nextMs = new Date('2026-09-01T21:30:00Z').getTime();
    const r = TurnoverPredictionService.predict({
      tenantId: 't1', tableId: 'T4',
      currentReservationId: 'r1', nextReservationId: 'r2',
      currentStartMs: startMs, nextSlotMs: nextMs,
      partySize: 4, menuProfile: 'tasting',
      turnoverBufferMinutes: 15,
    });
    // 150 min × 1.12 (partySize) × 1 (KDS) = 168 min → 19h30 + 168 = 22h18 → overlap
    expect(r.collisionRisk).toBe('overlap');
    expect(r.overstayMinutes).toBeGreaterThan(0);
  });

  it('quick 2 personnes → aucune collision', async () => {
    const { TurnoverPredictionService } = await import(
      '@/modules/commerce/relation/reservations/services/TurnoverPredictionService'
    );
    const startMs = 0;
    const nextMs = 3 * 3600 * 1000;
    const r = TurnoverPredictionService.predict({
      tenantId: 't1', tableId: 'T4',
      currentReservationId: 'r1', nextReservationId: 'r2',
      currentStartMs: startMs, nextSlotMs: nextMs,
      partySize: 2, menuProfile: 'quick',
    });
    expect(r.collisionRisk).toBe('none');
  });
});

// ── M101 — Pacing Saturation Emitter ────────────────────────────────────────
describe('M101 — ReservationPacingSaturationEmitter', () => {
  it('slot saturé → émet event + audit', async () => {
    const { ReservationPacingSaturationEmitter } = await import(
      '@/modules/commerce/relation/reservations/services/ReservationPacingSaturationEmitter'
    );
    const r = await ReservationPacingSaturationEmitter.evaluateAndNotify({
      tenantId: 't1',
      operatorId: 'op_1',
      config: {
        defaultMaxCoversPerSlot: 4,
        slotIntervalMinutes: 15,
        serviceStartTime: '19:00',
        serviceEndTime: '22:00',
      },
      existingReservations: [
        { id: 'r1', timeSlot: '19:30', partySize: 4 },
      ],
      requestedSlot: '19:30',
      partySize: 2,
    });
    expect(r.canAccept).toBe(false);
    expect(emittedEvents.some(e => e.name === 'commerce.reservation_pacing_saturated')).toBe(true);
  });

  it('slot libre → pas d\'event', async () => {
    const { ReservationPacingSaturationEmitter } = await import(
      '@/modules/commerce/relation/reservations/services/ReservationPacingSaturationEmitter'
    );
    const r = await ReservationPacingSaturationEmitter.evaluateAndNotify({
      tenantId: 't1',
      operatorId: 'op_1',
      config: {
        defaultMaxCoversPerSlot: 12,
        slotIntervalMinutes: 15,
        serviceStartTime: '19:00',
        serviceEndTime: '22:00',
      },
      existingReservations: [],
      requestedSlot: '19:30',
      partySize: 2,
    });
    expect(r.canAccept).toBe(true);
    expect(emittedEvents.length).toBe(0);
  });
});
