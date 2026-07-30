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
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider: providerId } = await params;

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

        // Existence check AVANT set() — set() est un upsert, donc on ne peut plus
        // distinguer création vs retry après l'écriture.
        const existing = await Nexus.adapter.get(
            `tenants/${order.tenantId}/deliveryOrders/${order.id}`
        );

        await Nexus.adapter.set(
            `tenants/${order.tenantId}/deliveryOrders/${order.id}`,
            order
        );

        // N'émettre order.placed que si la commande n'existait pas — sinon le KDS
        // reçoit un doublon à chaque retry du provider.
        if (!existing && order.status !== 'cancelled') {
            await NexusEventBus.emitDurable('order.placed', {
                v: 1,
                orderId:    order.id,
                tableId:    null,
                tenantId:   order.tenantId,
                operatorId: `delivery:${providerId}`,
                items:      [],
            });
        }

        // Si la commande entrante (nouvelle ou màj) est annulée, on émet l'événement
        if (order.status === 'cancelled' && existing?.status !== 'cancelled') {
            await NexusEventBus.emitDurable('order.cancelled', {
                v: 1,
                orderId: order.id,
                tenantId: order.tenantId,
                operatorId: `delivery:${providerId}`,
                reason: 'Annulé par le partenaire de livraison',
            });
        }

        logger.info(`[delivery/webhook] provider=${providerId} orderId=${order.id} tenant=${order.tenantId}`);
        return NextResponse.json({ received: true, orderId: order.id });
    } catch (err) {
        logger.error(`[delivery/webhook] provider=${providerId}`, err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
