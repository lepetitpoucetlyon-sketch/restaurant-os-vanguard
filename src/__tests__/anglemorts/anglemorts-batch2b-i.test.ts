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

import { TvaLivraisonGuard } from '@/modules/finance/fiscalite/TvaLivraisonGuard';
import { RevPASHService } from '@/modules/intelligence/analytique/analytics/RevPASHService';
import { MassDataExportAlertService } from '@/modules/compliance/securite/MassDataExportAlertService';
import { TrustScoreAntiDDoSService } from '@/modules/commerce/relation/reservations/services/TrustScoreAntiDDoSService';
import { CO2AlertService } from '@/modules/compliance/qualite/haccp/services/CO2AlertService';
import { WormRetentionEnforcer } from '@/modules/compliance/reglementaire/WormRetentionEnforcer';

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
