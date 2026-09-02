import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AirlockPipeline } from '@/modules/intelligence/migration/AirlockPipeline';
import { Slayer } from '@/modules/intelligence/services/Slayer';
import type { LegacyImportConfig, LegacyOrder } from '@nexus/contracts';

describe('Reprise d\'Antériorité & Suture des Migrations (Grade X / Loi 12)', () => {
    const tenantId = 'tenant_bistro_legacy';
    const genesisDate = '2026-09-01T00:00:00.000Z';

    const baseConfig: LegacyImportConfig = {
        sessionId: 'session_test_migration_001',
        sourceSystem: 'zelty',
        format: 'csv',
        genesisDate,
        integrationMode: 'PONT',
        tenantId,
        initiatedBy: 'admin_user',
        startedAt: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. AirlockPipeline — Sas de Décontamination (4 Étapes)', () => {
        it('exécute PARSE, DEDUP, VALIDATE et ENRICH sur des données brutes', async () => {
            const pipeline = new AirlockPipeline(baseConfig);
            const rawRows: Record<string, string | number | null>[] = [
                { id: '101', total: '45.50', date: '2026-08-15', category: 'sales', customer: 'Jean Dupont' },
                { id: '102', total: '12.00', date: '2026-08-16', category: 'purchases', supplier: 'Metro' },
                { id: '103', total: '45.50', date: '2026-08-15', category: 'sales', customer: 'Jean Dupont' }, // Duplicate candidate
                { id: '104', total: null, date: null, category: null }, // Empty row
            ];

            const report = await pipeline.execute(rawRows);

            expect(report.stats.totalDocumentsIngested).toBe(4);
            expect(report.stats.rejectedDocuments).toBe(1); // Row 104
            expect(report.stats.duplicatesFound).toBeGreaterThanOrEqual(1); // Row 103 vs 101
            expect(report.stats.successfullyNormalized).toBeGreaterThanOrEqual(1);
        });

        it('calcule et extrait les balances d\'ouverture (Opening Balances)', async () => {
            const pipeline = new AirlockPipeline(baseConfig);
            const rawRows: Record<string, string | number | null>[] = [
                { id: '201', total: '100.00', date: '2026-08-20', category: 'sales' },
                { id: '202', total: '40.00', date: '2026-08-21', category: 'purchases' },
            ];

            await pipeline.execute(rawRows);
            const balances = pipeline.extractOpeningBalances();

            expect(balances.length).toBeGreaterThanOrEqual(1);
            const salesBal = balances.find(b => b.accountCode === '701');
            if (salesBal) {
                expect(salesBal.side).toBe('credit');
            }
        });

        it('génère une écriture d\'ouverture conforme NF525 (seq=1, previousHash=GENESIS_ROOT)', async () => {
            const pipeline = new AirlockPipeline(baseConfig);
            const rawRows: Record<string, string | number | null>[] = [
                { id: '301', total: '250.00', date: '2026-08-28', category: 'sales' },
            ];

            await pipeline.execute(rawRows);
            const opening = pipeline.generateOpeningEntry();

            expect(opening.id).toBe(`opening_${baseConfig.sessionId}`);
            expect(opening.sequence).toBe(1);
            expect(opening.previousHash).toBe('GENESIS_ROOT');
            expect(opening.fiscalSealHash).toBeDefined();
            expect(typeof opening.fiscalSealHash).toBe('string');
            expect(opening.asOfDate).toBe(genesisDate);
        });
    });

    describe('2. Mode de Persistance (AirlockPipeline.commit)', () => {
        it('en mode TABULA_RASA, aucune donnée n\'est persistée', async () => {
            const pipeline = new AirlockPipeline({ ...baseConfig, integrationMode: 'TABULA_RASA' });
            await pipeline.execute([{ id: '401', total: '50.00', date: '2026-08-01' }]);

            const result = await pipeline.commit('TABULA_RASA');
            expect(result.archiveSaved).toBe(0);
            expect(result.legacyOrdersSaved).toBe(0);
            expect(result.openingEntry).toBeUndefined();
        });

        it('en mode PONT, persiste legacyArchive et OpeningEntry dans journalEntries', async () => {
            const pipeline = new AirlockPipeline({ ...baseConfig, integrationMode: 'PONT' });
            await pipeline.execute([
                { id: '501', total: '120.00', date: '2026-08-10', category: 'sales' },
            ]);

            const result = await pipeline.commit('PONT');
            expect(result.archiveSaved).toBeGreaterThanOrEqual(1);
            expect(result.openingEntry).toBeDefined();
            expect(result.openingEntry?.sequence).toBe(1);
            expect(result.legacyOrdersSaved).toBe(0); // PONT ne stocke pas le détail des commandes
        });

        it('en mode SUTURE_TOTALE, persiste l\'archive, l\'ouverture ET legacyOrders', async () => {
            const pipeline = new AirlockPipeline({ ...baseConfig, integrationMode: 'SUTURE_TOTALE' });
            await pipeline.execute([
                { id: '601', total: '85.00', date: '2026-08-12', category: 'sales' },
            ]);

            const result = await pipeline.commit('SUTURE_TOTALE');
            expect(result.archiveSaved).toBeGreaterThanOrEqual(1);
            expect(result.openingEntry).toBeDefined();
            expect(result.legacyOrdersSaved).toBeGreaterThanOrEqual(1);
        });
    });

    describe('3. Slayer — Ingestion SUTURE_TOTALE sécurisée', () => {
        it('ingère un flux de commandes dans legacyOrders sans polluer orders/ live', async () => {
            const mockStream: LegacyOrder[] = [
                {
                    id: 'zelty_ord_9901',
                    totalInCents: 3500,
                    totalInMicrounits: 35_000_000 as import('@/shared/schemas/primitives').Microunits,
                    timestamp: '2026-07-20T12:30:00Z',
                    items: [],
                    customerName: 'Client Historique',
                } as unknown as LegacyOrder,
            ];

            const res = await Slayer.ingestMassive(mockStream, tenantId);
            expect(res.ingested).toBe(1);
            expect(res.errors).toBe(0);
        });
    });
});
