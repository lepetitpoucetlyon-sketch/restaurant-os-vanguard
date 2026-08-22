/**
 * Tests des items 🟢 débloqués par ADR-014 (Top critiques restaurant/MCC).
 * L25, L55/MCC-C4, L58, L61, MCC-E2, D5 — logique pure + assertions IO mockées.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
      query: vi.fn(async (prefix: string) => {
        const out: unknown[] = [];
        for (const [k, v] of nexusStore.entries()) {
          if (k.startsWith(prefix)) out.push(v);
        }
        return out;
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

vi.mock('@/modules/compliance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/compliance')>();
  return {
    ...actual,
    AuditLogger: {
      ...actual.AuditLogger,
      logAction: vi.fn(async (_admin: string, action: string, targetId: string, metadata?: unknown) => {
        auditLogs.push({ action, targetId, metadata });
        return { id: 'log_x', hash: 'fake_hash', previousHash: 'prev', timestamp: Date.now() };
      }),
      verifyChain: vi.fn(async (logs: Array<{ id: string; previousHash: string; hash: string }>) => {
        const breaks: Array<{ id: string; expectedPrev: string; actualPrev: string }> = [];
        let expectedPrev = logs[0]?.previousHash ?? 'GENESIS';
        for (const l of logs) {
          if (l.previousHash !== expectedPrev) {
            breaks.push({ id: l.id, expectedPrev, actualPrev: l.previousHash });
          }
          expectedPrev = l.hash;
        }
        return { valid: breaks.length === 0, breaks };
      }),
      exportChain: vi.fn(async () => ({
        logs: [],
        fromTs: 0,
        toTs: 0,
        finalHash: 'FINAL_HASH_MOCK',
        count: 0,
        exportedAt: new Date().toISOString(),
        integrityValid: true,
        breaks: [],
      })),
    },
  };
});
vi.mock('@/modules/compliance/securite/AuditLogger', () => ({
  AuditLogger: {
    logAction: vi.fn(async (_admin: string, action: string, targetId: string, metadata?: unknown) => {
      auditLogs.push({ action, targetId, metadata });
      return { id: 'log_x', hash: 'fake_hash', previousHash: 'prev', timestamp: Date.now() };
    }),
    verifyChain: vi.fn(async (logs: Array<{ id: string; previousHash: string; hash: string }>) => {
      const breaks: Array<{ id: string; expectedPrev: string; actualPrev: string }> = [];
      let expectedPrev = logs[0]?.previousHash ?? 'GENESIS';
      for (const l of logs) {
        if (l.previousHash !== expectedPrev) {
          breaks.push({ id: l.id, expectedPrev, actualPrev: l.previousHash });
        }
        expectedPrev = l.hash;
      }
      return { valid: breaks.length === 0, breaks };
    }),
    exportChain: vi.fn(async () => ({
      logs: [],
      fromTs: 0,
      toTs: 0,
      finalHash: 'FINAL_HASH_MOCK',
      count: 0,
      exportedAt: new Date().toISOString(),
      integrityValid: true,
      breaks: [],
    })),
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

beforeEach(() => {
  nexusStore.clear();
  emittedEvents.length = 0;
  auditLogs.length = 0;
  outboxEnqueued.length = 0;
});

// ── L55 / MCC-C4 — FiscalChainAnomalyDetector ───────────────────────────────
describe('L55 / MCC-C4 — FiscalChainAnomalyDetector', () => {
  it('chaîne cohérente → 0 event émis, 0 audit', async () => {
    const { FiscalChainAnomalyDetector } = await import(
      '@/modules/compliance/securite/FiscalChainAnomalyDetector'
    );
    const logs = [
      { id: 'l1', adminId: 'a', action: 'MFA_ENABLED', targetId: 't', ipAddress: '', timestamp: 1, previousHash: 'GENESIS', hash: 'h1' },
      { id: 'l2', adminId: 'a', action: 'MFA_ENABLED', targetId: 't', ipAddress: '', timestamp: 2, previousHash: 'h1', hash: 'h2' },
    ] as never[];
    const r = await FiscalChainAnomalyDetector.detectAnomalies('t1', logs);
    expect(r.breaks.length).toBe(0);
    expect(r.emittedEvents).toBe(0);
    expect(emittedEvents.length).toBe(0);
  });

  it('chaîne cassée → event crypto.integrity_failed + audit FISCAL_SEAL_ANOMALY_DETECTED', async () => {
    const { FiscalChainAnomalyDetector } = await import(
      '@/modules/compliance/securite/FiscalChainAnomalyDetector'
    );
    const logs = [
      { id: 'l1', adminId: 'a', action: 'MFA_ENABLED', targetId: 't', ipAddress: '', timestamp: 1, previousHash: 'GENESIS', hash: 'h1' },
      { id: 'l2', adminId: 'a', action: 'MFA_ENABLED', targetId: 't', ipAddress: '', timestamp: 2, previousHash: 'TAMPERED', hash: 'h2' },
    ] as never[];
    const r = await FiscalChainAnomalyDetector.detectAnomalies('t1', logs);
    expect(r.breaks.length).toBe(1);
    expect(emittedEvents.some(e => e.name === 'crypto.integrity_failed')).toBe(true);
    expect(auditLogs.some(l => l.action === 'FISCAL_SEAL_ANOMALY_DETECTED')).toBe(true);
  });
});

// ── L58 — Chilling compliance ───────────────────────────────────────────────
describe('L58 — ChillingComplianceService', () => {
  it('mesure 8°C à H+90min → conforme', async () => {
    const { ChillingComplianceService } = await import(
      '@/modules/compliance/qualite/haccp/services/ChillingComplianceService'
    );
    const cycle = await ChillingComplianceService.startCycle({
      tenantId: 't1',
      productLabel: 'Blanquette',
      batchQuantityKg: 30,
      startedTemperatureC: 75,
      operatorId: 'chef',
      now: 0,
    });
    const updated = await ChillingComplianceService.recordTemperature({
      tenantId: 't1',
      cycleId: cycle.id,
      temperatureC: 8,
      operatorId: 'chef',
      now: 90 * 60 * 1000,
    });
    expect(updated?.status).toBe('compliant');
  });

  it('cible atteinte trop tard → non_compliant + Outbox SANITAIRE + audit', async () => {
    const { ChillingComplianceService } = await import(
      '@/modules/compliance/qualite/haccp/services/ChillingComplianceService'
    );
    const cycle = await ChillingComplianceService.startCycle({
      tenantId: 't1',
      productLabel: 'Blanquette',
      batchQuantityKg: 30,
      startedTemperatureC: 75,
      operatorId: 'chef',
      now: 0,
    });
    const updated = await ChillingComplianceService.recordTemperature({
      tenantId: 't1',
      cycleId: cycle.id,
      temperatureC: 8,
      operatorId: 'chef',
      now: 3 * 3600 * 1000, // 3h > 2h max
    });
    expect(updated?.status).toBe('non_compliant');
    expect(outboxEnqueued[0].priority).toBe(2); // SANITAIRE
    expect(auditLogs.some(l => l.action === 'CHILLING_NONCONFORM')).toBe(true);
  });

  it('evaluateCompliance pur — cible jamais atteinte + timeout dépassé → TIMEOUT_EXCEEDED', async () => {
    const { ChillingComplianceService } = await import(
      '@/modules/compliance/qualite/haccp/services/ChillingComplianceService'
    );
    const r = ChillingComplianceService.evaluateCompliance(
      {
        id: 'c1', tenantId: 't', productLabel: 'x', batchQuantityKg: 1,
        startedAt: 0, startedTemperatureC: 70,
        measurements: [{ atMs: 0, temperatureC: 70, operatorId: 'op' }],
        status: 'in_progress',
      },
      3 * 3600 * 1000,
    );
    expect(r.compliant).toBe(false);
    expect(r.reason).toBe('TIMEOUT_EXCEEDED');
  });
});

// ── L61 — Registre biodéchets ───────────────────────────────────────────────
describe('L61 — BiodechetsRegistryService', () => {
  it('recordDailyWeighing persiste + Outbox LEGAL + audit', async () => {
    const { BiodechetsRegistryService } = await import(
      '@/modules/compliance/qualite/biodechets/BiodechetsRegistryService'
    );
    const entry = await BiodechetsRegistryService.recordDailyWeighing({
      tenantId: 't1',
      dateIso: '2026-08-21',
      category: 'cooked_leftovers',
      quantityKg: 4.2,
      destination: 'methanization',
      weighedBy: 'chef_1',
      collectorSiret: '12345678900011',
      now: 1000,
    });
    expect(entry.quantityKg).toBe(4.2);
    expect(outboxEnqueued[0].priority).toBe(3); // LEGAL
    expect(outboxEnqueued[0].collection).toContain('legal/biodechets');
    expect(auditLogs.some(l => l.metadata && (l.metadata as { kind: string }).kind === 'BIODECHETS_WEIGHING')).toBe(true);
  });

  it('quantityKg <= 0 → throw', async () => {
    const { BiodechetsRegistryService } = await import(
      '@/modules/compliance/qualite/biodechets/BiodechetsRegistryService'
    );
    await expect(
      BiodechetsRegistryService.recordDailyWeighing({
        tenantId: 't1', dateIso: '2026-08-21',
        category: 'other', quantityKg: 0, destination: 'incineration', weighedBy: 'x',
      }),
    ).rejects.toThrow('quantityKg');
  });

  it('generateAnnualAttestation agrège par catégorie + destination', async () => {
    const { BiodechetsRegistryService } = await import(
      '@/modules/compliance/qualite/biodechets/BiodechetsRegistryService'
    );
    await BiodechetsRegistryService.recordDailyWeighing({
      tenantId: 't1', dateIso: '2026-01-05',
      category: 'cooked_leftovers', quantityKg: 3, destination: 'methanization', weighedBy: 'x',
    });
    await BiodechetsRegistryService.recordDailyWeighing({
      tenantId: 't1', dateIso: '2026-02-10',
      category: 'food_prep_offcuts', quantityKg: 1.5, destination: 'composting_onsite', weighedBy: 'x',
    });
    const att = await BiodechetsRegistryService.generateAnnualAttestation('t1', 2026);
    expect(att.totalKg).toBe(4.5);
    expect(att.byCategory.cooked_leftovers).toBe(3);
    expect(att.byDestination.composting_onsite).toBe(1.5);
    expect(att.entriesCount).toBe(2);
    expect(att.auditHash).toBe('FINAL_HASH_MOCK');
  });
});

// ── MCC-E2 — MFA Enforcement ────────────────────────────────────────────────
describe('MCC-E2 — MFAEnforcementService', () => {
  it('assertMfaOrDeny → ok si rôle non protégé', async () => {
    const { MFAEnforcementService } = await import('@/lib/auth/MFAEnforcementService');
    const r = await MFAEnforcementService.assertMfaOrDeny('uid1', 'manager');
    expect(r.ok).toBe(true);
  });

  it('assertMfaOrDeny → MFA_REQUIRED si super_admin sans TOTP', async () => {
    const { MFAEnforcementService } = await import('@/lib/auth/MFAEnforcementService');
    await MFAEnforcementService.recordMfaEnrollment('uid_1', 'mcc_super_admin');
    // Simule disable pour créer state hasTotp:false
    await MFAEnforcementService.recordMfaDisablement('uid_1', 'uid_actor');
    const r = await MFAEnforcementService.assertMfaOrDeny('uid_1', 'mcc_super_admin');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('MFA_REQUIRED');
  });

  it('assertMfaOrDeny → ok après recordMfaEnrollment', async () => {
    const { MFAEnforcementService } = await import('@/lib/auth/MFAEnforcementService');
    await MFAEnforcementService.recordMfaEnrollment('uid_2', 'mcc_super_admin', '1.1.1.1');
    const r = await MFAEnforcementService.assertMfaOrDeny('uid_2', 'mcc_super_admin');
    expect(r.ok).toBe(true);
    expect(auditLogs.some(l => l.action === 'MFA_ENABLED')).toBe(true);
  });

  it('recordMfaDisablement audit MFA_DISABLED', async () => {
    const { MFAEnforcementService } = await import('@/lib/auth/MFAEnforcementService');
    await MFAEnforcementService.recordMfaEnrollment('uid_3', 'mcc_super_admin');
    await MFAEnforcementService.recordMfaDisablement('uid_3', 'uid_actor', '2.2.2.2');
    expect(auditLogs.some(l => l.action === 'MFA_DISABLED')).toBe(true);
  });
});

// ── D5 — TaxRateGuard ───────────────────────────────────────────────────────
describe('D5 — TaxRateGuard', () => {
  it('items tous OK → allowed', async () => {
    const { TaxRateGuard } = await import('@/modules/ops/service/pos/services/TaxRateGuard');
    const r = TaxRateGuard.evaluate([
      { cartId: 'a', productId: 'p1', name: 'X', taxRate: '0.10' },
      { cartId: 'b', productId: 'p2', name: 'Y', taxRate: '0.20' },
    ]);
    expect(r.allowed).toBe(true);
    expect(r.offendingItems.length).toBe(0);
  });

  it('item sans taxRate → offending + refus', async () => {
    const { TaxRateGuard } = await import('@/modules/ops/service/pos/services/TaxRateGuard');
    const r = TaxRateGuard.evaluate([
      { cartId: 'a', productId: 'p1', name: 'X', taxRate: '0.10' },
      { cartId: 'b', productId: 'p2', name: 'Y', taxRate: undefined },
      { cartId: 'c', productId: 'p3', name: 'Z', taxRate: null },
      { cartId: 'd', productId: 'p4', name: 'W', taxRate: '' },
    ]);
    expect(r.allowed).toBe(false);
    expect(r.offendingItems.length).toBe(3);
  });

  it('taxRate non standard → offending', async () => {
    const { TaxRateGuard } = await import('@/modules/ops/service/pos/services/TaxRateGuard');
    const r = TaxRateGuard.evaluate([
      { cartId: 'a', productId: 'p1', name: 'X', taxRate: '0.99' },
    ]);
    expect(r.allowed).toBe(false);
    expect(r.offendingItems[0].providedRate).toBe('0.99');
  });

  it('assertOrThrow throw si offending', async () => {
    const { TaxRateGuard } = await import('@/modules/ops/service/pos/services/TaxRateGuard');
    expect(() => TaxRateGuard.assertOrThrow([
      { cartId: 'a', productId: 'p1', name: 'X', taxRate: null },
    ])).toThrow('TAX_RATE_MISSING');
  });

  it('guard() trace audit si refus', async () => {
    const { TaxRateGuard } = await import('@/modules/ops/service/pos/services/TaxRateGuard');
    await TaxRateGuard.guard('t1', 'op1', 'ord_1', [
      { cartId: 'a', productId: 'p1', name: 'X', taxRate: undefined },
    ]);
    expect(auditLogs.some(l => l.action === 'FISCAL_SEAL_ANOMALY_DETECTED')).toBe(true);
  });
});
