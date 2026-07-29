import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { tenantId, serialNumber } = await req.json();

    if (!tenantId || !serialNumber) {
      return NextResponse.json({ error: 'Missing tenantId or serialNumber' }, { status: 400 });
    }

    logger.info(`[MDM Delivery Webhook] Device ${serialNumber} delivered to ${tenantId}. Triggering Stripe billing...`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real scenario, this would call Stripe to start the subscription for the hardware
    // e.g. stripe.subscriptions.create({ customer: tenantId, items: [{ price: 'price_hardware_ipad' }] })

    return NextResponse.json({ success: true, message: 'Billing started via Stripe' });
  } catch (error) {
    logger.error('[MDM Delivery Webhook] Failed to process delivery', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
