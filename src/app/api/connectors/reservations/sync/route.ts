import { NextRequest, NextResponse } from 'next/server';
import { ReservationProviderFactory } from '@/modules/ops';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * POST /api/connectors/reservations/sync
 * Déclenché par le cron toutes les 5 min pour synchroniser les réservations externes.
 * Body : { tenantId: string, provider?: string }
 */
export async function POST(req: NextRequest) {
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, provider } = await req.json() as { tenantId?: string; provider?: string };
    if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

    try {
        // Lire la préférence provider depuis les settings tenant
        const settings = await Nexus.adapter.get(`tenants/${tenantId}/settings`) as Record<string, unknown> | null;
        const providerId = provider ?? (settings?.['connectors'] as Record<string, string> | undefined)?.['reservations'];

        const p = ReservationProviderFactory.get(providerId);
        const reservations = await p.listUpcoming(tenantId);

        // Stocker dans Nexus (upsert par id)
        for (const r of reservations) {
            await Nexus.adapter.set(`tenants/${tenantId}/reservations/${r.id}`, r);
        }

        logger.info(`[reservations/sync] tenant=${tenantId} provider=${p.id} synced=${reservations.length}`);
        return NextResponse.json({ synced: reservations.length, provider: p.id });
    } catch (err) {
        logger.error('[reservations/sync] error', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
