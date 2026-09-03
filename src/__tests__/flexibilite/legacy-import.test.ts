import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LegacyImportService } from '@/modules/finance/comptabilite/LegacyImportService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';

describe('Lot 7 — Migration & Reprise d Antériorité Souple (M8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Importe l historique dans legacyArchive/ et scelle l À-Nouveau sans polluer la chaîne courante', async () => {
    const store: Record<string, unknown> = {};

    const mockBatch = {
      set: (path: string, data: unknown) => {
        store[path] = data;
      },
      update: (path: string, data: unknown) => {
        store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(data as Record<string, unknown>) };
      },
      delete: (path: string) => {
        delete store[path];
      },
      commit: async () => {},
    };

    vi.spyOn(Nexus.adapter, 'batch').mockReturnValue(mockBatch as never);

    vi.spyOn(FiscalSealer, 'sealDataAtomically').mockImplementation(
      async (_data, _tenant, _isSim, base) => {
        const sealId = 'seal_legacy_ouv_123';
        if (base) {
          store[`tenants/resto-mig/journalEntries/${base.id}`] = base;
        }
        return {
          sealId,
          hash: 'abcdef1234567890',
          signature: 'sig_123',
          previousHash: 'GENESIS_ROOT',
        };
      }
    );

    const result = await LegacyImportService.importLegacyLedger({
      tenantId: 'resto-mig',
      cutoverDate: '2026-07-01',
      sourceSoftware: 'lightspeed',
      importedBy: 'expert-comptable-1',
      entries: [
        {
          externalId: 'LS-001',
          date: '2026-06-15',
          amountInMicrounits: 120_000_000, // 120 €
          description: 'Ticket Lightspeed 001',
        },
        {
          externalId: 'LS-002',
          date: '2026-06-20',
          amountInMicrounits: 80_000_000, // 80 €
          description: 'Ticket Lightspeed 002',
        },
      ],
    });

    // 1. Les écritures sont dans legacyArchive
    expect(result.importedCount).toBe(2);
    expect(result.totalRevenueInMicrounits).toBe(200_000_000);
    expect(store['tenants/resto-mig/legacyArchive/leg_lightspeed_LS-001']).toBeDefined();
    expect(store['tenants/resto-mig/legacyArchive/leg_lightspeed_LS-002']).toBeDefined();

    // 2. Le Bilan d'Ouverture a été scellé
    expect(result.openingEntryId).toBe('JE_OPENING_20260701');
    expect(result.openingSealId).toBe('seal_legacy_ouv_123');
    expect(store['tenants/resto-mig/journalEntries/JE_OPENING_20260701']).toBeDefined();
  });

  it('Rejette toute écriture postérieure à la date de bascule (cutoverDate) pour préserver la fiscalité', async () => {
    await expect(
      LegacyImportService.importLegacyLedger({
        tenantId: 'resto-mig',
        cutoverDate: '2026-07-01',
        sourceSoftware: 'zelty',
        importedBy: 'expert-comptable-1',
        entries: [
          {
            externalId: 'ZT-999',
            date: '2026-07-05', // Postérieur au cutoverDate !
            amountInMicrounits: 50_000_000,
          },
        ],
      })
    ).rejects.toThrow(/après la date de bascule/);
  });
});
