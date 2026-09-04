import { NextRequest, NextResponse } from 'next/server';
import { CronScheduler } from '@/lib/cron/CronScheduler';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * GET /api/cron/tick
 *
 * Déclencheur DURABLE du moteur Cron central (audit S1 : `CronScheduler` n'avait
 * aucun appelant → clôture Z auto, facturation SaaS, URSSAF, rappels… ne tournaient
 * jamais ; le `setInterval` in-process ne survivait pas au serverless de toute façon).
 *
 * Appelé par Vercel Cron toutes les 5 minutes (voir `vercel.json`). Chaque job
 * ne s'exécute que si son `schedule` cron tombe dans la fenêtre du tick (5 min).
 * Protégé par CRON_SECRET (`x-vercel-cron-signature`, `x-cron-secret` ou `?secret`).
 */
export async function GET(req: NextRequest) {
    const incomingSecret =
        req.headers.get('x-vercel-cron-signature') ??
        req.headers.get('x-cron-secret') ??
        req.nextUrl.searchParams.get('secret');

    const expectedSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === 'production' && (!expectedSecret || incomingSecret !== expectedSecret)) {
        logger.warn('[cron/tick] Tentative d\'accès non autorisée');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await CronScheduler.runDue(new Date(), 5);
        return NextResponse.json({ ok: true, ...result }, { status: result.errors > 0 ? 207 : 200 });
    } catch (error) {
        const err = toError(error);
        logger.error('[cron/tick] Erreur fatale', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
