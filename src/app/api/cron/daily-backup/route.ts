import { NextRequest, NextResponse } from 'next/server';
import { DailyBackupJob } from '@/lib/cron/DailyBackupJob';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * GET /api/cron/daily-backup
 *
 * Déclencheur automatique de sauvegarde quotidienne (Vercel Cron: "0 2 * * *").
 * Protégé par CRON_SECRET (`x-vercel-cron-signature` ou `x-cron-secret`).
 */
export async function GET(req: NextRequest) {
    const incomingSecret =
        req.headers.get('x-vercel-cron-signature') ??
        req.headers.get('x-cron-secret') ??
        req.nextUrl.searchParams.get('secret');

    const expectedSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === 'production' && (!expectedSecret || incomingSecret !== expectedSecret)) {
        logger.warn('[cron/daily-backup] Tentative d\'accès non autorisée');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const report = await DailyBackupJob.execute();
        return NextResponse.json(report, {
            status: report.failed > 0 ? 207 : 200,
        });
    } catch (error) {
        const err = toError(error);
        logger.error('[cron/daily-backup] Erreur fatale', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
