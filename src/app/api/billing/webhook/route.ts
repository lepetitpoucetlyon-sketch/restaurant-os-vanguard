import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
 
import { BillingService } from '@/src/modules/finance/services/BillingService';;
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * POST /api/billing/webhook
 * Stripe sends events here. We verify the signature, then delegate to BillingService.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-06-24.dahlia' });
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    logger.warn('[webhook] Signature verification failed', toError(err).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await BillingService.handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error('[webhook] Handler error', toError(err).message);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
