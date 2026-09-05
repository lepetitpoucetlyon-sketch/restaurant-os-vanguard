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

import { withWebhookRoute } from '@/lib/server/routeWrapper';

/**
 * POST /api/webhooks/stripe
 * Reçoit les events Stripe, valide HMAC et délègue aux handlers spécialisés.
 */
export const POST = withWebhookRoute(
  async (req: NextRequest, ctx) => {
    const rawBody = await req.text();

    let event: StripeEvent;
    try {
      event = JSON.parse(rawBody) as StripeEvent;
    } catch {
      return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    logger.info(`[Stripe Webhook] Event reçu: ${event.type} (id: ${event.id})`, { correlationId: ctx.correlationId });

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
      logger.error('[Stripe Webhook] Erreur traitement event', { error, correlationId: ctx.correlationId });
      return NextResponse.json({ received: true, error: 'Erreur interne' });
    }

    return NextResponse.json({ received: true });
  },
  {
    verifySignature: async (req) => {
      if (!STRIPE_WEBHOOK_SECRET) {
        logger.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET non configuré — requête rejetée (Sécurité P0)');
        return false;
      }
      const signatureHeader = req.headers.get('stripe-signature');
      const rawBody = await req.text();
      return verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
    },
  },
);
