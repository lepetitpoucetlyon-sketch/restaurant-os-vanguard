import { NextRequest, NextResponse } from 'next/server';
import { DeliveryWebhookBridge, type DeliveryProvider, type ExternalDeliveryPayload } from '@/modules/commerce';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'x-tenant-id header manquant' }, { status: 400 });
  }

  if (!['ubereats', 'deliveroo', 'justeat'].includes(provider)) {
    return NextResponse.json({ error: `Provider non supporté: ${provider}` }, { status: 400 });
  }

  try {
    const payload = (await req.json()) as ExternalDeliveryPayload;

    const order = await DeliveryWebhookBridge.processIncomingDeliveryOrder(
      tenantId,
      provider as DeliveryProvider,
      payload
    );

    return NextResponse.json({ success: true, orderId: order.orderId }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur traitement webhook livraison' }, { status: 500 });
  }
}
