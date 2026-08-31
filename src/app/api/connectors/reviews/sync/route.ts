import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { ReviewProviderFactory } from '@/modules/commerce';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * POST /api/connectors/reviews/sync
 * Cron quotidien : récupère les avis récents de toutes les plateformes configurées.
 * Body : { tenantId: string, provider?: string, sinceHours?: number }
 */
export async function POST(req: NextRequest) {
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, provider, sinceHours = 24 } = await req.json() as {
        tenantId?: string;
        provider?: string;
        sinceHours?: number;
    };
    if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

    try {
        const settings = await Nexus.adapter.get(`tenants/${tenantId}/settings`) as Record<string, unknown> | null;
        const providerId = provider ?? (settings?.['connectors'] as Record<string, string> | undefined)?.['reviews'];

        const p     = ReviewProviderFactory.get(providerId);
        const since = new Date(Date.now() - sinceHours * 3600 * 1000);
        const reviews = await p.fetchRecent(tenantId, since);

        for (const review of reviews) {
            await Nexus.adapter.set(`tenants/${tenantId}/reviews/${review.id}`, review);
        }

        const avgScore = reviews.length > 0
            ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
            : await p.getAverageScore(tenantId);

        // Mettre à jour le score moyen dans les stats tenant
        if (avgScore > 0) {
            await Nexus.adapter.set(`tenants/${tenantId}/stats/reviews`, {
                averageScore: avgScore,
                totalFetched: reviews.length,
                lastSync:     new Date().toISOString(),
                provider:     p.id,
            });
        }

        logger.info(`[reviews/sync] tenant=${tenantId} provider=${p.id} fetched=${reviews.length} avg=${avgScore.toFixed(2)}`);
        return NextResponse.json({ fetched: reviews.length, averageScore: avgScore, provider: p.id });
    } catch (err) {
        logger.error('[reviews/sync] error', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
