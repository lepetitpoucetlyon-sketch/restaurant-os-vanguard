import { NextRequest, NextResponse } from 'next/server';
import { DeliveryProviderFactory } from '@/modules/ops/connectors/delivery';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { checkFallbackWebhookSecret } from '@/lib/server/webhookVerify';

/**
 * POST /api/connectors/delivery/webhook/{provider}
 * Reçoit les commandes livraison entrantes (Uber Eats, Deliveroo…).
 * Écrit dans Nexus → KDS reçoit via onSnapshot.
 *
 * Sécurité : chaque provider implémente verifySignature() avec son HMAC propre.
 * Fallback : CONNECTORS_WEBHOOK_SECRET (Bearer) pour les providers sans HMAC dédié.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { provider: string } }
) {
    const providerId = params.provider;

    // Lire le body brut avant de parser — nécessaire pour la vérification HMAC
    const rawBody = await req.text();
    let payload: unknown;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    let p: ReturnType<typeof DeliveryProviderFactory.get>;
    try {
        p = DeliveryProviderFactory.get(providerId);
    } catch {
        return NextResponse.json({ error: `Provider inconnu : ${providerId}` }, { status: 404 });
    }

    // Vérification de signature — provider-specific ou fallback partagé
    const verified = p.verifySignature
        ? p.verifySignature(rawBody, req.headers)
        : checkFallbackWebhookSecret(req.headers, providerId);

    if (!verified) {
        logger.warn(`[delivery/webhook] Signature invalide — provider=${providerId}`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!p.verifySignature && !process.env.CONNECTORS_WEBHOOK_SECRET) {
        logger.warn(`[delivery/webhook] provider=${providerId} sans HMAC et sans CONNECTORS_WEBHOOK_SECRET — webhook non sécurisé`);
    }

    try {
        const order = p.onWebhook(payload);

        if (!order.tenantId) {
            return NextResponse.json({ error: 'tenantId manquant' }, { status: 422 });
        }

        await Nexus.adapter.set(
            `tenants/${order.tenantId}/deliveryOrders/${order.id}`,
            order
        );

        NexusEventBus.emit('order.placed', {
            orderId:    order.id,
            tableId:    null,
            tenantId:   order.tenantId,
            operatorId: `delivery:${providerId}`,
            items:      [],
        });

        logger.info(`[delivery/webhook] provider=${providerId} orderId=${order.id} tenant=${order.tenantId}`);
        return NextResponse.json({ received: true, orderId: order.id });
    } catch (err) {
        logger.error(`[delivery/webhook] provider=${providerId}`, err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
