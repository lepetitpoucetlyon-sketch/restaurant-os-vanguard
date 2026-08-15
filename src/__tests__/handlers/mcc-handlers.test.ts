/**
 * MCC handlers — tests unitaires
 * Stratégie : import direct des fonctions handler extraites (handleMccHealthPing,
 * handleMccFiscalAuditRequired). On spy sur le vrai Nexus.adapter initialisé par
 * tests/setup.ts (MockAdapter) — pas de vi.mock du module NexusAdapter.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// NexusEventBus mocké pour que les registerMcc* puissent être importés sans effets de bord
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: {
    on:          vi.fn(() => () => {}),
    emit:        vi.fn().mockResolvedValue(undefined),
    emitDurable: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/shared-kernel', () => ({
  SharedKernel: {
    generateId: vi.fn((prefix: string) => `${prefix}-test-001`),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));

// ── Imports après mocks ───────────────────────────────────────────────────────

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { handleMccHealthPing } from '@/shared/eventBus/handlers/MccHealthPingHandler';
import { handleMccFiscalAuditRequired } from '@/shared/eventBus/handlers/MccFiscalAuditHandler';

// ── Setup : spy sur le vrai Nexus.adapter (MockAdapter injectée par tests/setup.ts) ──

let setSpy: ReturnType<typeof vi.spyOn>;
let querySpy: ReturnType<typeof vi.spyOn>;
let batchSpy: ReturnType<typeof vi.spyOn>;

const batchMock = {
  set:       vi.fn(),
  update:    vi.fn(),
  delete:    vi.fn(),
  increment: vi.fn(),
  commit:    vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.restoreAllMocks();
  setSpy   = vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);
  querySpy = vi.spyOn(Nexus.adapter, 'query').mockResolvedValue([]);
  batchSpy = vi.spyOn(Nexus.adapter, 'batch').mockReturnValue(batchMock as unknown as ReturnType<typeof Nexus.adapter.batch>);

  // Reset batch internals
  batchMock.delete.mockReset();
  batchMock.commit.mockReset();
  batchMock.commit.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── MccHealthPingHandler ──────────────────────────────────────────────────────

describe('MccHealthPingHandler', () => {
  it('écrit l\'état courant + le snapshot historique du jour', async () => {
    const payload = { tenantId: 'tenant-abc', status: 'healthy', posOnline: true };
    await handleMccHealthPing(payload as unknown as Record<string, unknown>);

    const setCalls = setSpy.mock.calls;
    // Au moins 2 set : état courant + historique journalier
    expect(setCalls.length).toBeGreaterThanOrEqual(2);

    // 1. État courant
    const currentCall = setCalls.find((c: any[]) => c[0] === 'mcc/tenantHealth/tenant-abc');
    expect(currentCall).toBeDefined();
    expect((currentCall![1] as Record<string, unknown>).status).toBe('healthy');
    expect((currentCall![1] as Record<string, unknown>).tenantId).toBe('tenant-abc');

    // 2. Historique — chemin de la forme mcc/tenantHealth/tenant-abc/history/YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);
    const historyCall = setCalls.find((c: any[]) =>
      (c[0] as string).startsWith('mcc/tenantHealth/tenant-abc/history/')
    );
    expect(historyCall).toBeDefined();
    expect(historyCall![0]).toBe(`mcc/tenantHealth/tenant-abc/history/${today}`);
    expect((historyCall![1] as Record<string, unknown>).status).toBe('healthy');
  });

  it('purge les entrées > 7 jours (best-effort) si query en retourne', async () => {
    querySpy.mockResolvedValue([
      { id: '2020-01-01', updatedAt: '2020-01-01T00:00:00.000Z' },
      { id: '2020-01-02', updatedAt: '2020-01-02T00:00:00.000Z' },
    ] as unknown[]);

    await handleMccHealthPing({ tenantId: 'tenant-xyz', status: 'degraded' });

    expect(batchMock.delete).toHaveBeenCalledTimes(2);
    expect(batchMock.commit).toHaveBeenCalled();
  });

  it('continue sans erreur si la purge échoue', async () => {
    querySpy.mockRejectedValue(new Error('Firestore timeout'));

    // Ne doit pas propager l'erreur
    await expect(
      handleMccHealthPing({ tenantId: 'tenant-err', status: 'healthy' })
    ).resolves.not.toThrow();

    // Les 2 set principaux ont quand même été appelés
    const setCalls = setSpy.mock.calls;
    expect(setCalls.length).toBeGreaterThanOrEqual(2);
  });
});

// ── MccFiscalAuditHandler ─────────────────────────────────────────────────────

describe('MccFiscalAuditHandler', () => {
  it('crée un document d\'audit fiscal avec status pending', async () => {
    const payload = {
      tenantId: 'tenant-hotel',
      reason: 'Séjour reservation-001 : montant élevé 15000.00 €',
      urgency: 'high' as const,
    };
    await handleMccFiscalAuditRequired(payload as unknown as Record<string, unknown>);

    const setCalls = setSpy.mock.calls;
    expect(setCalls).toHaveLength(1);

    const [path, data] = setCalls[0] as [string, Record<string, unknown>];
    expect(path).toMatch(/^mcc\/fiscalAudits\//);
    expect(data.tenantId).toBe('tenant-hotel');
    expect(data.reason).toBe(payload.reason);
    expect(data.urgency).toBe('high');
    expect(data.status).toBe('pending');
    expect(typeof data.requestedAt).toBe('string');
  });

  it('gère les trois niveaux d\'urgence', async () => {
    for (const urgency of ['low', 'high', 'critical'] as const) {
      setSpy.mockClear();
      await handleMccFiscalAuditRequired({ tenantId: 't', reason: 'test', urgency });
      const data = setSpy.mock.calls[0]![1] as Record<string, unknown>;
      expect(data.urgency).toBe(urgency);
    }
  });
});
