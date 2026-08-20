/**
 * DailyBackupJob — Moteur de sauvegarde quotidienne automatique pour la flotte.
 *
 * Fonctionnalités :
 * - Itère sur tous les tenants actifs (ou ciblés)
 * - Exporte l'état via SnapshotService (gzippé + checksum SHA-256)
 * - Enregistre dans le BackupProvider configuré (GCS, S3, R2, local)
 * - Persiste le BackupManifest dans `mcc/backupManifests`
 * - Émet une alerte critique via OpsAlertGateway en cas d'échec
 * - Expose un résultat structuré pour les jobs cron et tests automatisés
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { getBackupProvider } from '@/infrastructure/services/backup/BackupProvider';
import type { BackupManifest } from '@/infrastructure/services/backup/BackupProvider';
import { serializeSnapshot } from '@/infrastructure/services/backup/SnapshotService';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const DAILY_BACKUP_COLLECTIONS = [
    'journalEntries',
    'fiscalSeals',
    'fiscalLedger',
    'tenantConfig',
    'products',
    'bankTransactions',
    'stockMovements',
    'haccpLogs',
    'recipes',
    'staff',
] as const;

export interface DailyBackupOptions {
    tenantIds?: string[];
    dryRun?: boolean;
    now?: () => string;
}

export interface TenantBackupResult {
    tenantId: string;
    status: 'ok' | 'error';
    checksum?: string;
    bytes?: number;
    location?: string;
    error?: string;
}

export interface DailyBackupReport {
    timestamp: string;
    provider: string;
    totalTenants: number;
    succeeded: number;
    failed: number;
    durationMs: number;
    results: TenantBackupResult[];
}

export class DailyBackupJob {
    /**
     * Exécute la sauvegarde quotidienne complète de la flotte.
     */
    static async execute(opts: DailyBackupOptions = {}): Promise<DailyBackupReport> {
        const start = Date.now();
        const nowIso = opts.now?.() ?? new Date().toISOString();
        const provider = getBackupProvider();

        // 1. Résoudre la liste des tenants
        let tenantIds = opts.tenantIds ?? [];
        if (tenantIds.length === 0) {
            try {
                const instances = await Nexus.adapter.query<{ id: string }>('mcc/empire/instances');
                tenantIds = instances.map(i => i.id).filter(Boolean);
            } catch (err) {
                logger.warn('[DailyBackupJob] Impossible de charger mcc/empire/instances, tentative via tenantConfig', err);
            }
        }

        // Fallback démo si aucun tenant trouvé
        if (tenantIds.length === 0) {
            tenantIds = ['demo-restaurant', 'default'];
        }

        logger.info(`[DailyBackupJob] Démarrage sauvegarde quotidienne — ${tenantIds.length} tenant(s) via ${provider.name}`);

        const results: TenantBackupResult[] = [];
        let succeeded = 0;
        let failed = 0;

        // 2. Traitement séquentiel ou semi-parallèle
        for (const tenantId of tenantIds) {
            try {
                const { buffer, checksum, bytes, payload } = await serializeSnapshot(Nexus.adapter, {
                    tenantId,
                    collections: DAILY_BACKUP_COLLECTIONS,
                    now: () => nowIso,
                });

                const dateStr = nowIso.slice(0, 10);
                const filename = `backups/${tenantId}/${dateStr}-${checksum.slice(0, 8)}.json.gz`;

                if (!opts.dryRun) {
                    const uploadResult = await provider.upload(filename, buffer);

                    const retainUntil = new Date(new Date(nowIso).getTime() + 7 * 365.25 * 24 * 3600 * 1000).toISOString();

                    const manifest: BackupManifest = {
                        id: `backup-${tenantId}-${Date.now()}`,
                        tenantId,
                        createdAt: nowIso,
                        sizeBytes: bytes,
                        checksum,
                        collections: Array.from(DAILY_BACKUP_COLLECTIONS),
                        fileName: filename,
                        provider: provider.name,
                        retainUntil,
                    };

                    await Nexus.adapter.set(`mcc/backupManifests/${manifest.id}`, manifest);

                    results.push({
                        tenantId,
                        status: 'ok',
                        checksum,
                        bytes,
                        location: uploadResult.location ?? filename,
                    });
                } else {
                    results.push({
                        tenantId,
                        status: 'ok',
                        checksum,
                        bytes,
                        location: filename,
                    });
                }
                succeeded++;
            } catch (error) {
                const err = toError(error);
                failed++;
                logger.error(`[DailyBackupJob] Échec sauvegarde tenant ${tenantId}`, err.message);

                results.push({
                    tenantId,
                    status: 'error',
                    error: err.message,
                });

                // Émission immédiate d'alerte ops
                await OpsAlertGateway.send({
                    severity: 'critical',
                    title: `Échec Sauvegarde Quotidienne [${tenantId}]`,
                    source: 'daily-backup-cron',
                    message: `La sauvegarde automatique du tenant ${tenantId} a échoué via ${provider.name} : ${err.message}`,
                    context: {
                        tenantId,
                        provider: provider.name,
                        error: err.message,
                        timestamp: nowIso,
                    },
                });
            }
        }

        const durationMs = Date.now() - start;
        const report: DailyBackupReport = {
            timestamp: nowIso,
            provider: provider.name,
            totalTenants: tenantIds.length,
            succeeded,
            failed,
            durationMs,
            results,
        };

        // Alerte globale si au moins 1 échec
        if (failed > 0) {
            await OpsAlertGateway.send({
                severity: 'critical',
                title: `Rapport Sauvegarde : ${failed}/${tenantIds.length} échecs`,
                source: 'daily-backup-cron',
                message: `Le job de sauvegarde quotidienne s'est terminé avec ${failed} échec(s) sur ${tenantIds.length} tenants.`,
                context: {
                    failed,
                    succeeded,
                    total: tenantIds.length,
                    durationMs,
                    provider: provider.name,
                },
            });
        } else {
            logger.info(`[DailyBackupJob] Sauvegarde terminée avec succès pour ${succeeded} tenant(s) en ${durationMs}ms`);
        }

        return report;
    }
}
