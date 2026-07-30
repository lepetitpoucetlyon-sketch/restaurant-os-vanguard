import 'server-only';
import Stripe from 'stripe';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { PRICING } from '@/shared/constants/pricing';

const STRIPE_API_VERSION = '2026-06-24.dahlia' as const;

export interface FleetTreasuryReport {
  /** MRR réel basé sur les abonnements Stripe actifs (€) */
  mrr: number;
  /** CA encaissé depuis le 1er du mois courant (€) */
  collectedMtd: number;
  /** Nombre d'abonnements actifs */
  activeSubscriptions: number;
  /** Nombre d'abonnements annulés sur les 30 derniers jours */
  churnLast30Days: number;
  /** Source : 'stripe' si clé présente, 'theoretical' sinon */
  source: 'stripe' | 'theoretical';
}

export type PlanTier = keyof typeof PRICING;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('[BillingService] STRIPE_SECRET_KEY env var not set');
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
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

      case 'invoice.payment_failed': {
        // Dunning progressif — ne pas suspendre immédiatement
        const dueAt = new Date().toISOString();
        await Nexus.adapter.set(configPath, {
          billing: { status: 'past_due', dueAt },
          status: { economy: { billingStatus: 'past_due' } },
        }, { merge: true });
        await Nexus.adapter.set(`mcc/dunning/${tenantId}`, {
          tenantId,
          dueAt,
          step: 0,          // 0=past_due, 1=relance J+3, 2=suspend J+7, 3=LOCKED J+14
          nextActionAt: new Date(Date.now() + 3 * 86400_000).toISOString(),
        });
        logger.warn(`[BillingService] ${tenantId} → PAST_DUE (dunning démarré)`);
        break;
      }

      case 'customer.subscription.deleted': {
        await Nexus.adapter.set(configPath, {
          billing: { status: 'cancelled' },
          status: { economy: { billingStatus: 'cancelled' }, licenceStatus: 'LOCKED' },
        }, { merge: true });
        logger.warn(`[BillingService] ${tenantId} → CANCELLED + LOCKED`);
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

  /**
   * Retourne le rapport financier réel de la flotte depuis Stripe.
   *
   * - MRR : somme des montants des abonnements actifs (recurring amount × qty)
   * - CA encaissé MTD : invoices.paid depuis le 1er du mois courant
   * - Churn : abonnements annulés sur les 30 derniers jours
   *
   * Si STRIPE_SECRET_KEY n'est pas défini, retourne un rapport `source: 'theoretical'`
   * calculé à partir du pricing config × nb instances dans la DB.
   */
  async getFleetTreasuryReport(): Promise<FleetTreasuryReport> {
    const key = process.env.STRIPE_SECRET_KEY;

    if (!key) {
      // Fallback théorique : compter les tenants actifs depuis Firestore
      logger.warn('[BillingService] STRIPE_SECRET_KEY absent — rapport théorique');
      return buildTheoreticalReport();
    }

    const stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION });

    try {
      // 1. MRR : abonnements actifs
      let mrr = 0;
      let activeSubscriptions = 0;
      for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
        activeSubscriptions++;
        for (const item of sub.items.data) {
          const price = item.price;
          if (price.recurring && price.unit_amount) {
            // Normaliser en mensuel (peut être annual)
            const monthly = price.recurring.interval === 'year'
              ? price.unit_amount / 12
              : price.unit_amount;
            mrr += (monthly * (item.quantity ?? 1)) / 100; // cents → €
          }
        }
      }

      // 2. CA encaissé depuis le 1er du mois courant
      const now = new Date();
      const startOfMonth = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
      let collectedMtd = 0;
      for await (const inv of stripe.invoices.list({
        status: 'paid',
        created: { gte: startOfMonth },
        limit: 100,
      })) {
        collectedMtd += inv.amount_paid / 100;
      }

      // 3. Churn sur 30 jours
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 86400_000) / 1000);
      let churnLast30Days = 0;
      for await (const sub of stripe.subscriptions.list({
        status: 'canceled',
        created: { gte: thirtyDaysAgo },
        limit: 100,
      })) {
        void sub; // on compte seulement
        churnLast30Days++;
      }

      logger.info(`[BillingService] Treasury report — MRR=€${mrr.toFixed(0)} subs=${activeSubscriptions} MTD=€${collectedMtd.toFixed(0)} churn=${churnLast30Days}`);

      return { mrr, collectedMtd, activeSubscriptions, churnLast30Days, source: 'stripe' };

    } catch (err) {
      logger.error('[BillingService] getFleetTreasuryReport Stripe error', err);
      return buildTheoreticalReport();
    }
  },
};

async function buildTheoreticalReport(): Promise<FleetTreasuryReport> {
  // Compter les tenants avec billing ACTIVE en Firestore comme approximation
  try {
    type TenantConfig = { billing?: { status?: string; plan?: string } };
    const configs = await Nexus.adapter.query<TenantConfig>('tenantConfig');
    const active = configs.filter(c => c.billing?.status === 'ACTIVE');
    const mrr = active.reduce((sum, c) => {
      const tier = (c.billing?.plan ?? 'STANDARD') as keyof typeof PRICING;
      return sum + (PRICING[tier in PRICING ? tier : 'STANDARD']?.monthlyEur ?? 0);
    }, 0);
    return { mrr, collectedMtd: 0, activeSubscriptions: active.length, churnLast30Days: 0, source: 'theoretical' };
  } catch {
    return { mrr: 0, collectedMtd: 0, activeSubscriptions: 0, churnLast30Days: 0, source: 'theoretical' };
  }
}
