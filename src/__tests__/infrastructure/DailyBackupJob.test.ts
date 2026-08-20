import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DailyBackupJob } from '@/lib/cron/DailyBackupJob';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';

describe('DailyBackupJob — Automatisation de la sauvegarde de flotte', () => {
    let mockAdapter: MockAdapter;

    beforeEach(() => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('exécute une sauvegarde avec succès sur les tenants configurés', async () => {
        // Seed tenant
        await mockAdapter.set('tenants/resto-test/products/p1', {
            id: 'p1',
            name: 'Croissant',
            priceInMicrounits: 1_500_000,
        });

        const report = await DailyBackupJob.execute({
            tenantIds: ['resto-test'],
            dryRun: false,
            now: () => '2026-08-20T02:00:00.000Z',
        });

        expect(report.totalTenants).toBe(1);
        expect(report.succeeded).toBe(1);
        expect(report.failed).toBe(0);
        expect(report.results[0].status).toBe('ok');
        expect(report.results[0].checksum).toBeDefined();

        // Vérifier l'enregistrement du manifeste dans Nexus
        const manifests = await mockAdapter.query<any>('mcc/backupManifests');
        expect(manifests.length).toBeGreaterThan(0);
        expect(manifests[0].tenantId).toBe('resto-test');
    });

    it('émet une alerte OpsAlertGateway en cas d\'échec de sauvegarde', async () => {
        const sendAlertSpy = vi.spyOn(OpsAlertGateway, 'send').mockResolvedValue(true);

        // Forcer une erreur en simulant un adapter défaillant sur query
        vi.spyOn(mockAdapter, 'query').mockRejectedValueOnce(new Error('Disque plein ou indisponible'));

        const report = await DailyBackupJob.execute({
            tenantIds: ['resto-error'],
            dryRun: false,
        });

        expect(report.failed).toBe(1);
        expect(report.results[0].status).toBe('error');
        expect(sendAlertSpy).toHaveBeenCalled();
        expect(sendAlertSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'critical',
                source: 'daily-backup-cron',
            })
        );
    });
});
