import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchPeriodCloseService } from '@/modules/finance/fiscalite/BatchPeriodCloseService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';

describe('Lot 4 — Clôtures Périodiques Souples & Batch Z (M4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    NexusEventBus.resetForTesting();
    IdempotencyGuard.clearMemoryCache();
  });

  it('enumerateDays() génère une séquence chronologique complète et ininterrompue', () => {
    const days = BatchPeriodCloseService.enumerateDays('2026-08-01', '2026-08-05');
    expect(days).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
    ]);
  });

  it('Clôture en rafale : clôture séquentiellement, gère les jours blancs et ignore les jours déjà scellés', async () => {
    const store: Record<string, unknown> = {
      // Jour 1 : Déjà scellé dans le passé
      'tenants/resto-batch/journalEntries/Z_20260801': {
        id: 'Z_20260801',
        date: '2026-08-01',
        totalInMicrounits: 40_000_000,
        ordersCount: 2,
      },
      // Jour 2 : Ticket Z actif avec des ventes
      'tenants/resto-batch/ticketZ/2026-08-02': {
        id: '2026-08-02',
        date: '2026-08-02',
        tenantId: 'resto-batch',
        ordersCount: 3,
        totalInMicrounits: 60_000_000,
        taxBreakdown: { '0.10': 6_000_000 },
      },
      // Jour 3 : Journée blanche (aucun document ticketZ n'existe)
      // Jour 4 : Ticket Z actif avec 1 vente
      'tenants/resto-batch/ticketZ/2026-08-04': {
        id: '2026-08-04',
        date: '2026-08-04',
        tenantId: 'resto-batch',
        ordersCount: 1,
        totalInMicrounits: 25_000_000,
        taxBreakdown: { '0.20': 5_000_000 },
      },
    };

    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
      return (store[path] as never) ?? null;
    });

    vi.spyOn(Nexus.adapter, 'runTransaction').mockImplementation(async (callback) => {
      const tx = {
        get: async (path: string) => (store[path] as unknown) ?? null,
        set: async (path: string, val: unknown) => { store[path] = val; },
        update: async (path: string, val: unknown) => {
          store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(val as Record<string, unknown>) };
        },
        delete: async (path: string) => { delete store[path]; },
      };
      return callback(tx as never);
    });

    let batchEvent: unknown = null;
    NexusEventBus.on('finance.period_closed_batch', async (payload) => {
      batchEvent = payload;
    });

    const result = await BatchPeriodCloseService.closePeriodRange({
      tenantId: 'resto-batch',
      fromDay: '2026-08-01',
      toDay: '2026-08-04',
      operatorId: 'gerant-1',
      allowBlankDays: true,
    });

    // 4 jours traités au total
    expect(result.closedDays).toHaveLength(4);

    // Jour 2 et Jour 4 ont été clôturés, Jour 3 a été clôturé en journée blanche, Jour 1 réutilisé
    expect(result.totalOrdersCount).toBe(6); // 2 (jour 1) + 3 (jour 2) + 0 (jour 3) + 1 (jour 4)
    expect(result.totalInMicrounits).toBe(125_000_000); // 40 + 60 + 0 + 25 = 125€

    expect(batchEvent).toBeDefined();
    expect((batchEvent as { totalOrdersCount: number }).totalOrdersCount).toBe(6);
  });
});
