/**
 * MCC handlers — tests unitaires
 * MccHealthPingHandler et MccFiscalAuditHandler
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks globaux ─────────────────────────────────────────────────────────────

const batchMock = {
  set:       vi.fn(),
  update:    vi.fn(),
  delete:    vi.fn(),
  increment: vi.fn(),
  commit:    vi.fn().mockResolvedValue(undefined),
};



vi.mock('@/lib/shared-kernel', () => ({
  SharedKernel: {
    generateId: vi.fn((prefix: string) => `${prefix}-test-001`),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports après mocks ───────────────────────────────────────────────────────

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

function captureHandler(eventName?: string): (...args: unknown[]) => Promise<void> {
  const calls = vi.mocked(NexusEventBus.on).mock.calls;
  if (eventName) {
    const match = calls.find(c => c[0] === eventName);
    if (!match) throw new Error(`No handler registered for event "${eventName}"`);
    return match[1] as (...args: unknown[]) => Promise<void>;
  }
  const last = calls[calls.length - 1];
  return last[1] as (...args: unknown[]) => Promise<void>;
}

beforeEach(() => {
  vi.clearAllMocks();
  batchMock.delete.mockReset();
  batchMock.commit.mockResolvedValue(undefined);
  
  vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined as any);
  vi.spyOn(Nexus.adapter, 'query').mockResolvedValue([] as any);
  vi.spyOn(Nexus.adapter, 'batch').mockReturnValue(batchMock as any);
  
  vi.spyOn(NexusEventBus, 'on').mockImplementation((_event: string, handler: any) => () => handler);
  vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined);
  vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined);
});

// ── MccHealthPingHandler ──────────────────────────────────────────────────────

describe('MccHealthPingHandler', () => {
  it('écrit l\'état courant + le snapshot historique du jour', async () => {
    const { registerMccHealthPingHandler } = await import(
      '@/bootstrap/eventBus/handlers/MccHealthPingHandler'
    );
    registerMccHealthPingHandler();
    const handler = captureHandler();

    const payload = { tenantId: 'tenant-abc', status: 'healthy', posOnline: true };
    await handler(payload);

    const setCalls = vi.mocked(Nexus.adapter.set).mock.calls;
    // Au moins 2 set : état courant + historique journalier
    expect(setCalls.length).toBeGreaterThanOrEqual(2);

    // 1. État courant
    const currentCall = setCalls.find(c => c[0] === 'mcc/tenantHealth/tenant-abc');
    expect(currentCall).toBeDefined();
    expect((currentCall![1] as Record<string, unknown>).status).toBe('healthy');
    expect((currentCall![1] as Record<string, unknown>).tenantId).toBe('tenant-abc');

    // 2. Historique — chemin de la forme mcc/tenantHealth/tenant-abc/history/YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);
    const historyCall = setCalls.find(c =>
      (c[0] as string).startsWith(`mcc/tenantHealth/tenant-abc/history/`)
    );
    expect(historyCall).toBeDefined();
    expect(historyCall![0]).toBe(`mcc/tenantHealth/tenant-abc/history/${today}`);
    expect((historyCall![1] as Record<string, unknown>).status).toBe('healthy');
  });

  it('purge les entrées > 7 jours (best-effort) si query en retourne', async () => {
    vi.mocked(Nexus.adapter.query).mockResolvedValue([
      { id: '2020-01-01', updatedAt: '2020-01-01T00:00:00.000Z' },
      { id: '2020-01-02', updatedAt: '2020-01-02T00:00:00.000Z' },
    ] as unknown[]);

    const { registerMccHealthPingHandler } = await import(
      '@/bootstrap/eventBus/handlers/MccHealthPingHandler'
    );
    registerMccHealthPingHandler();
    const handler = captureHandler();

    await handler({ tenantId: 'tenant-xyz', status: 'degraded' });

    expect(batchMock.delete).toHaveBeenCalledTimes(2);
    expect(batchMock.commit).toHaveBeenCalled();
  });

  it('continue sans erreur si la purge échoue', async () => {
    vi.mocked(Nexus.adapter.query).mockRejectedValue(new Error('Firestore timeout'));

    const { registerMccHealthPingHandler } = await import(
      '@/bootstrap/eventBus/handlers/MccHealthPingHandler'
    );
    registerMccHealthPingHandler();
    const handler = captureHandler();

    // Ne doit pas propager l'erreur
    await expect(handler({ tenantId: 'tenant-err', status: 'healthy' })).resolves.not.toThrow();

    // Les 2 set principaux ont quand même été appelés
    const setCalls = vi.mocked(Nexus.adapter.set).mock.calls;
    expect(setCalls.length).toBeGreaterThanOrEqual(2);
  });
});

// ── MccFiscalAuditHandler ─────────────────────────────────────────────────────

describe('MccFiscalAuditHandler', () => {
  it('crée un document d\'audit fiscal avec status pending', async () => {
    const { registerMccFiscalAuditHandler } = await import(
      '@/bootstrap/eventBus/handlers/MccFiscalAuditHandler'
    );
    registerMccFiscalAuditHandler();
    const handler = captureHandler('mcc.fiscal_audit_required');

    const payload = {
      tenantId: 'tenant-hotel',
      reason: 'Séjour reservation-001 : montant élevé 15000.00 €',
      urgency: 'high' as const,
    };
    await handler(payload);

    const setCalls = vi.mocked(Nexus.adapter.set).mock.calls;
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
    const { registerMccFiscalAuditHandler } = await import(
      '@/bootstrap/eventBus/handlers/MccFiscalAuditHandler'
    );

    for (const urgency of ['low', 'high', 'critical'] as const) {
      vi.clearAllMocks();
      vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined as any);
      vi.spyOn(NexusEventBus, 'on').mockImplementation((_event: string, handler: any) => () => handler);
      registerMccFiscalAuditHandler();
      const handler = captureHandler('mcc.fiscal_audit_required');
      await handler({ tenantId: 't', reason: 'test', urgency });
      const data = vi.mocked(Nexus.adapter.set).mock.calls[0]![1] as Record<string, unknown>;
      expect(data.urgency).toBe(urgency);
    }
  });
});
