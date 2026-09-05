import { type NextRequest, NextResponse } from 'next/server';
import { CronScheduler } from '@/lib/cron/CronScheduler';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { isAuthorizedCronRequest } from '@/lib/server/cronAuth';
import { withPublicRoute } from '@/lib/server/routeWrapper';

/**
 * GET /api/cron/tick
 *
 * Déclencheur DURABLE du moteur Cron central (audit S1 : `CronScheduler` n'avait
 * aucun appelant → clôture Z auto, facturation SaaS, URSSAF, rappels… ne tournaient
 * jamais ; le `setInterval` in-process ne survivait pas au serverless de toute façon).
 *
 * Appelé par Vercel Cron toutes les 5 minutes (voir `vercel.json`). Chaque job
 * ne s'exécute que si son `schedule` cron tombe dans la fenêtre du tick (5 min).
 * Protégé par le contrat Vercel : `Authorization: Bearer $CRON_SECRET`.
 */
export const GET = withPublicRoute(async (req: NextRequest, ctx) => {
    if (process.env.NODE_ENV === 'production' && !isAuthorizedCronRequest(req)) {
        logger.warn('[cron/tick] Tentative d\'accès non autorisée', { correlationId: ctx.correlationId });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await CronScheduler.runDue(new Date(), 5);
        return NextResponse.json({ ok: true, ...result }, { status: result.errors > 0 ? 207 : 200 });
    } catch (error) {
        const err = toError(error);
        logger.error('[cron/tick] Erreur fatale', { error: err.message, correlationId: ctx.correlationId });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
});
