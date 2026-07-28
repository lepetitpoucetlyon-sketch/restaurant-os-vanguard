import { NextRequest, NextResponse } from 'next/server';
import { DeliveryProviderFactory } from '@/modules/ops/connectors/delivery/DeliveryProviderFactory';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * POST /api/connectors/delivery/webhook/{provider}
 * Reçoit les commandes livraison entrantes (Uber Eats, Deliveroo…).
 * Écrit dans Nexus → KDS reçoit via onSnapshot.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { provider: string } }
) {
    const providerId = params.provider;
    let payload: unknown;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    try {
        const p     = DeliveryProviderFactory.get(providerId);
        const order = p.onWebhook(payload);

        if (!order.tenantId) {
            return NextResponse.json({ error: 'tenantId manquant' }, { status: 422 });
        }

        // Écriture dans Nexus — KDS et POS reçoivent via Firestore onSnapshot
        await Nexus.adapter.set(
            `tenants/${order.tenantId}/deliveryOrders/${order.id}`,
            order
        );

        // Événement NexusEventBus — réutilise l'event order.placed avec une source livraison
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
        logger.error(`[delivery/webhook] provider=${providerId}`, String(err));
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
