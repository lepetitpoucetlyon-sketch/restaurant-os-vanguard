import 'server-only';
import Stripe from 'stripe';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { PRICING } from '@/shared/constants/pricing';

export type PlanTier = keyof typeof PRICING;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('[BillingService] STRIPE_SECRET_KEY env var not set');
  return new Stripe(key, { apiVersion: '2026-05-27.dahlia' });
}

export const BillingService = {
  /**
   * Creates a Stripe Checkout session for a new tenant.
   * Called at the end of the signup flow.
   */
  async createCheckoutSession(params: {
    tenantId: string;
    email: string;
    tier: PlanTier;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }> {
    const stripe = getStripe();
    const tier = PRICING[params.tier];

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: params.email,
      line_items: [{ price: tier.stripePriceId, quantity: 1 }],
      metadata: { tenantId: params.tenantId, tier: params.tier },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    logger.info(`[BillingService] Checkout created for ${params.tenantId} — tier=${params.tier} @ €${tier.monthlyEur}`);
    return { url: session.url ?? params.successUrl };
  },

  /**
   * Handles a verified Stripe webhook event.
   * Updates the tenant's billingStatus in Firestore.
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const obj = event.data.object as unknown as { metadata?: Record<string, string> };
    const tenantId = obj.metadata?.tenantId ?? null;

    if (!tenantId) {
      logger.warn(`[BillingService] Webhook ${event.type} — no tenantId in metadata, skipping`);
      return;
    }

    const configPath = `tenants/${tenantId}/tenantConfig`;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await Nexus.adapter.set(configPath, {
          billing: {
            status: 'ACTIVE',
            plan: session.metadata?.tier ?? 'STANDARD',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            nextBillingDate: new Date(Date.now() + 30 * 86400_000).toISOString(),
          },
          status: { economy: { billingStatus: 'ACTIVE' } },
        }, { merge: true });
        logger.info(`[BillingService] ${tenantId} → ACTIVE (checkout completed)`);
        break;
      }

      case 'invoice.paid': {
        await Nexus.adapter.set(configPath, {
          billing: {
            status: 'ACTIVE',
            nextBillingDate: new Date(Date.now() + 30 * 86400_000).toISOString(),
          },
          status: { economy: { billingStatus: 'ACTIVE' } },
        }, { merge: true });
        logger.info(`[BillingService] ${tenantId} → ACTIVE (invoice paid)`);
        break;
      }

      case 'invoice.payment_failed':
      case 'customer.subscription.deleted': {
        await Nexus.adapter.set(configPath, {
          billing: { status: 'suspended' },
          status: { economy: { billingStatus: 'suspended' } },
        }, { merge: true });
        logger.warn(`[BillingService] ${tenantId} → SUSPENDED (${event.type})`);
        break;
      }

      default:
        logger.info(`[BillingService] Unhandled event type: ${event.type}`);
    }
  },

  /**
   * Creates a Stripe Customer Portal session for managing subscription.
   */
  async createPortalSession(stripeCustomerId: string, returnUrl: string): Promise<{ url: string }> {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  },
};
