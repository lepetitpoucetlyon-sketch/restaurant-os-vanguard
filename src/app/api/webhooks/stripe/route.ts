import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type {
  StripeEvent,
  StripeSubscription,
  StripeCheckoutSession,
} from './handlers/stripeWebhookTypes';
import { verifyStripeSignature } from './handlers/stripeWebhookTypes';
import { handleCheckoutSessionCompleted } from './handlers/handleCheckoutSessionCompleted';
import { handleSubscriptionEvent } from './handlers/handleSubscriptionEvents';
import { handlePaymentFailed, handlePaymentIntentSucceeded } from './handlers/handlePaymentEvents';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

/**
 * POST /api/webhooks/stripe
 * Reçoit les events Stripe, valide HMAC et délègue aux handlers spécialisés.
 */
export async function POST(req: NextRequest) {
  const signatureHeader = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  if (!STRIPE_WEBHOOK_SECRET) {
    logger.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET non configuré — requête rejetée (Sécurité P0)');
    return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 });
  }

  const isValid = verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    logger.warn('[Stripe Webhook] Signature invalide — requête rejetée');
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
  }

  logger.info(`[Stripe Webhook] Event reçu: ${event.type} (id: ${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as StripeCheckoutSession);
        break;

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(
          event.type,
          event.data.object as StripeSubscription
        );
        break;

      case 'payment_intent.payment_failed':
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Record<string, unknown>);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Record<string, unknown>);
        break;

      default:
        logger.info(`[Stripe Webhook] Event non géré: ${event.type}`);
    }
  } catch (error) {
    logger.error('[Stripe Webhook] Erreur traitement event', error);
    return NextResponse.json({ received: true, error: 'Erreur interne' });
  }

  return NextResponse.json({ received: true });
}
