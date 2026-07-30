import { NextRequest, NextResponse } from 'next/server';
import { ReservationProviderFactory } from '@/modules/ops/connectors/reservations';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { checkFallbackWebhookSecret } from '@/lib/server/webhookVerify';

/**
 * POST /api/connectors/reservations/webhook/{provider}
 * Reçoit les webhooks entrants des providers de réservation (Zenchef, TheFork…).
 *
 * Sécurité : chaque provider implémente verifySignature() avec son HMAC propre.
 * Fallback : CONNECTORS_WEBHOOK_SECRET (Bearer) pour les providers sans HMAC dédié.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider: providerId } = await params;
    const rawBody    = await req.text();
    let payload: unknown;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    let p: ReturnType<typeof ReservationProviderFactory.get>;
    try {
        p = ReservationProviderFactory.get(providerId);
    } catch {
        return NextResponse.json({ error: `Provider inconnu : ${providerId}` }, { status: 404 });
    }

    const verified = p.verifySignature
        ? p.verifySignature(rawBody, req.headers)
        : checkFallbackWebhookSecret(req.headers, providerId);

    if (!verified) {
        logger.warn(`[reservations/webhook] Signature invalide — provider=${providerId}`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!p.verifySignature && !process.env.CONNECTORS_WEBHOOK_SECRET) {
        logger.warn(`[reservations/webhook] provider=${providerId} sans HMAC et sans CONNECTORS_WEBHOOK_SECRET — webhook non sécurisé`);
    }

    try {
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
        logger.error(`[reservations/webhook] provider=${providerId}`, err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
