import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { PassThrough } from 'node:stream';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { getBackupProvider } from '@/infrastructure/services/backup/BackupProvider';
import type { BackupManifest } from '@/infrastructure/services/backup/BackupProvider';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const BackupBodySchema = z.object({
  tenantIds: z.array(z.string()).optional()
});

/**
 * GET  /api/admin/fleet/backup          — Liste les sauvegardes disponibles
 * POST /api/admin/fleet/backup          — Déclenche une sauvegarde immédiate
 *                                         body: { tenantIds?: string[] } (vide = toute la flotte)
 * POST /api/admin/fleet/backup?action=purge — Purge les sauvegardes > 7 ans
 *
 * Auth: fleet_admin
 *
 * Conformité NF525 : journaux fiscaux conservés 6 ans. On utilise 7 ans par sécurité.
 * Le backup exporte : journalEntries, fiscalSeals, tenantConfig (pas de données perso raw).
 */

const NF525_COLLECTIONS = ['journalEntries', 'fiscalSeals'] as const;
const FULL_COLLECTIONS  = [...NF525_COLLECTIONS, 'tenantConfig', 'products', 'bankTransactions'] as const;
const RETAIN_YEARS = 7;

export async function GET(request: NextRequest) {
    const caller = await requireMccLevel(request, 'fleet_admin');
    if (isDenied(caller)) return caller;

    try {
        const provider = getBackupProvider();
        const files = await provider.list('backups/');
        const manifests = await Nexus.adapter.query<BackupManifest>('mcc/backupManifests');

        return NextResponse.json({
            provider:  provider.name,
            files,
            manifests: manifests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50),
        });
    } catch (err) {
        logger.error('[backup] GET error', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const caller = await requireMccLevel(request, 'fleet_admin');
    if (isDenied(caller)) return caller;

    const action = request.nextUrl.searchParams.get('action');

    if (action === 'purge') {
        try {
            const provider = getBackupProvider();
            const cutoff = new Date();
            cutoff.setFullYear(cutoff.getFullYear() - RETAIN_YEARS);
            const deleted = await provider.purgeOlderThan(cutoff);
            empireAudit.log({ action: 'backup_purge', module: 'fleet', userId: caller.uid, timestamp: new Date() });
            return NextResponse.json({ purged: deleted, beforeDate: cutoff.toISOString() });
        } catch (err) {
            logger.error('[backup] Purge failed', err);
            return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
        }
    }

    // ── Backup complet ────────────────────────────────────────────────────────
    let body: z.infer<typeof BackupBodySchema> = {};
    try { 
        body = BackupBodySchema.parse(await request.json()); 
    } catch { 
        body = {}; 
    }

    const provider = getBackupProvider();
    const now = new Date().toISOString();
    const manifests: BackupManifest[] = [];

    // Résoudre la liste de tenants à sauvegarder
    let tenantIds: string[] = body.tenantIds ?? [];
    if (tenantIds.length === 0) {
        const instances = await Nexus.adapter.query<{ id: string }>('mcc/empire/instances');
        tenantIds = instances.map(i => i.id).filter(Boolean);
    }

    logger.info(`[backup] Démarrage sauvegarde — ${tenantIds.length} tenant(s) via ${provider.name}`);

    const results: { tenantId: string; status: 'ok' | 'error'; location?: string; error?: string }[] = [];

    for (const tenantId of tenantIds) {
        try {
            const colResults = await Promise.all(
                FULL_COLLECTIONS.map(col =>
                    Nexus.adapter.query(`tenants/${tenantId}/${col}`).then(data => [col, data] as const)
                )
            );
            const exportData: Record<string, unknown[]> = Object.fromEntries(colResults);

            const jsonBuffer = Buffer.from(JSON.stringify({ tenantId, exportedAt: now, collections: exportData }));

            // Gzip
            const compressed = await gzipBuffer(jsonBuffer);

            // Checksum SHA-256 du fichier compressé
            const checksum = createHash('sha256').update(compressed).digest('hex');

            const dateSlug = now.slice(0, 10); // YYYY-MM-DD
            const fileName = `backups/${dateSlug}/${tenantId}.json.gz`;

            const { location } = await provider.upload(fileName, compressed);

            // Calculer la date de rétention NF525
            const retainUntil = new Date();
            retainUntil.setFullYear(retainUntil.getFullYear() + RETAIN_YEARS);

            const manifestId = Nexus.adapter.generateId('mcc/backupManifests');
            const manifest: BackupManifest = {
                id:          manifestId,
                tenantId,
                createdAt:   now,
                provider:    provider.name,
                fileName,
                sizeBytes:   compressed.length,
                collections: FULL_COLLECTIONS as unknown as string[],
                checksum,
                retainUntil: retainUntil.toISOString(),
            };
            await Nexus.adapter.set(`mcc/backupManifests/${manifestId}`, manifest);
            manifests.push(manifest);

            results.push({ tenantId, status: 'ok', location });
            logger.info(`[backup] ✅ ${tenantId} → ${location} (${compressed.length} bytes)`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`[backup] ❌ ${tenantId}: ${msg}`);
            results.push({ tenantId, status: 'error', error: msg });
        }
    }

    const succeeded = results.filter(r => r.status === 'ok').length;
    empireAudit.log({
        action: 'backup_completed',
        module: 'fleet',
        userId: caller.uid,
        details: { provider: provider.name, tenants: tenantIds.length, succeeded } as unknown as import('@/shared/nexus-contract').SovereignData,
        timestamp: new Date(),
    });

    return NextResponse.json({
        provider:  provider.name,
        total:     tenantIds.length,
        succeeded,
        failed:    tenantIds.length - succeeded,
        results,
    });
}

async function gzipBuffer(input: Buffer): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const pass = new PassThrough();
    const gzip = createGzip();
    pass.end(input);
    const outStream = new PassThrough();
    outStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    await pipeline(pass, gzip, outStream);
    return Buffer.concat(chunks);
}
