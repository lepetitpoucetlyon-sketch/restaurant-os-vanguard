import { NextRequest, NextResponse } from 'next/server';
import { ReservationProviderFactory } from '@/modules/ops/connectors/reservations/ReservationProviderFactory';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * POST /api/connectors/reservations/webhook/{provider}
 * Reçoit les webhooks entrants des providers de réservation (Zenchef, TheFork…).
 * Le tenantId est résolu depuis le query param ou le payload normalisé.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { provider: string } }
) {
    const providerId = params.provider;
    const rawBody    = await req.text();
    let payload: unknown;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    try {
        const p           = ReservationProviderFactory.get(providerId);
        const reservation = p.onCreate(payload);

        if (!reservation.tenantId) {
            logger.warn('[reservations/webhook] tenantId manquant dans le payload', providerId);
            return NextResponse.json({ error: 'tenantId requis dans le payload' }, { status: 422 });
        }

        await Nexus.adapter.set(
            `tenants/${reservation.tenantId}/reservations/${reservation.id}`,
            reservation
        );

        logger.info(`[reservations/webhook] provider=${providerId} id=${reservation.id} tenant=${reservation.tenantId}`);
        return NextResponse.json({ received: true, id: reservation.id });
    } catch (err) {
        logger.error(`[reservations/webhook] provider=${providerId}`, String(err));
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
