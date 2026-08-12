import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MosyleClient } from '@/lib/MosyleClient';
import { TenantProvisioningService } from '@/lib/mcc/provisioning/TenantProvisioningService';
import { dispatchServerEvent } from '@orchestration/ServerEventBus';

// ── Plan-to-features mapping (P12-D / P12-J) ────────────────────────────────
const PLAN_FEATURES: Record<string, string[]> = {
  starter:    ['pos', 'kds'],
  pro:        ['pos', 'kds', 'marketing', 'crm', 'analytics'],
  enterprise: ['pos', 'kds', 'marketing', 'crm', 'analytics', 'rh', 'ia', 'haccp'],
};

/**
 * Resolve a Stripe price/product to one of our plan tiers.
 * Looks at price lookup_key, price metadata.plan, and product metadata.plan.
 */
function resolvePlanFromSubscription(subscription: StripeSubscription): string | null {
  const items = subscription.items?.data ?? [];
  for (const item of items) {
    const price = item.price;
    if (!price) continue;
    // 1. lookup_key (e.g. "pro_monthly")
    if (price.lookup_key) {
      const key = price.lookup_key.split('_')[0].toLowerCase();
      if (key in PLAN_FEATURES) return key;
    }
    // 2. price metadata
    if (price.metadata?.plan && price.metadata.plan in PLAN_FEATURES) {
      return price.metadata.plan;
    }
  }
  return null;
}

// Vérification HMAC manuelle — remplacer par stripe.webhooks.constructEvent
// quand le package stripe sera installé (npm install stripe).

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

interface StripeEventMetadata {
  tenantId?: string;
}

interface StripeCustomer {
  id: string;
  metadata?: StripeEventMetadata;
}

interface StripeSubscription {
  id: string;
  status: string;
  metadata?: StripeEventMetadata;
  customer?: string | StripeCustomer;
  items?: {
    data: Array<{
      price?: {
        id?: string;
        lookup_key?: string;
        product?: string;
        metadata?: Record<string, string>;
      };
    }>;
  };
}

interface StripeCheckoutSession {
  id: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  customer: string | null;
  customer_details: {
    email: string | null;
    name: string | null;
  } | null;
  metadata: {
    companyName?: string;
    siret?: string;
    ownerName?: string;
    planId?: 'STANDARD' | 'PREMIUM';
    primaryColor?: string;
    logoUrl?: string;
  } | null;
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripeSubscription | StripeCheckoutSession;
  };
}

/**
 * Vérifie la signature webhook Stripe manuellement via HMAC-SHA256.
 * Compatible avec le format Stripe-Signature: t=<timestamp>,v1=<signature>
 */
function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=');
    if (key && value) parts[key] = value;
  }

  const timestamp = parts['t'];
  const v1Signature = parts['v1'];

  if (!timestamp || !v1Signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // Comparaison à temps constant pour éviter les timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSig, 'hex'),
      Buffer.from(v1Signature, 'hex')
    );
  } catch {
    return false;
  }
}

function extractTenantId(subscription: StripeSubscription): string | undefined {
  return (
    subscription.metadata?.tenantId ??
    (typeof subscription.customer === 'object' && subscription.customer !== null
      ? subscription.customer.metadata?.tenantId
      : undefined)
  );
}

/**
 * POST /api/webhooks/stripe
 * Reçoit les events Stripe, vérifie la signature et met à jour le statut
 * du tenant en cas d'abonnement résilié ou inactif.
 *
 * Events gérés:
 * - customer.subscription.deleted
 * - customer.subscription.updated (si status !== 'active')
 *
 * ENV requis: STRIPE_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  const signatureHeader = req.headers.get('stripe-signature');

  // Lire le body en texte pour la vérification de signature
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
      case 'checkout.session.completed': {
        const session = event.data.object as StripeCheckoutSession;

        if (session.payment_status !== 'paid') {
          logger.info(`[Stripe Webhook] checkout.session.completed ignoré — payment_status=${session.payment_status}`);
          break;
        }

        const meta = session.metadata ?? {};
        const { companyName, siret, ownerName, planId, primaryColor, logoUrl } = meta;
        const ownerEmail = session.customer_details?.email ?? null;

        if (!companyName || !siret || !ownerEmail) {
          logger.error(
            `[Stripe Webhook] checkout.session.completed — métadonnées manquantes (companyName, siret, ownerEmail requis). Session: ${session.id}`
          );
          break;
        }

        // Idempotence : si le tenant existe déjà, Stripe retry ne reprovisionnera pas
        const existingConfig = await Nexus.adapter.get(`tenants/tenant_${siret}/tenantConfig`).catch(() => null);
        if (existingConfig) {
          logger.info(`[Stripe Webhook] Tenant tenant_${siret} déjà provisionné — session ${session.id} ignorée (idempotence)`);
          break;
        }

        logger.info(`[Stripe Webhook] Lancement provisionnement B2B pour ${companyName} (${siret})`);

        // Non-bloquant : on répond 200 à Stripe immédiatement, le provisionnement tourne en arrière-plan
        void (async () => {
          try {
            const result = await TenantProvisioningService.provisionNewClient({
              ownerEmail,
              ownerName: ownerName ?? ownerEmail,
              companyName,
              siret,
              planId: planId ?? 'STANDARD',
              branding: {
                primaryColor: primaryColor ?? '#6366f1',
                logoUrl: logoUrl ?? undefined,
              },
            });
            logger.info(`[Stripe Webhook] Provisionnement terminé: tenantId=${result.tenantId} stripe=${result.stripeCustomerId}`);
          } catch (err) {
            logger.error(`[Stripe Webhook] Échec provisionnement pour ${companyName} (${siret})`, err);
          }
        })();

        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as StripeSubscription;
        const tenantId = extractTenantId(subscription);

        if (!tenantId) {
          logger.warn(
            `[Stripe Webhook] tenantId introuvable dans les métadonnées pour subscription ${subscription.id}`
          );
          break;
        }

        // ── P12-D / P12-J: subscription active → auto-enable features ──
        if (
          event.type === 'customer.subscription.updated' &&
          subscription.status === 'active'
        ) {
          const plan = resolvePlanFromSubscription(subscription);
          if (plan) {
            const features = PLAN_FEATURES[plan] ?? [];
            const previousFeatures = await Nexus.adapter.get(
              `tenants/${tenantId}/billing/features`
            ) as { enabled?: string[] } | null;
            const previousEnabled = previousFeatures?.enabled ?? [];

            await Nexus.adapter.set(`tenants/${tenantId}/billing/features`, {
              plan,
              enabled: features,
              updatedAt: Date.now(),
              subscriptionId: subscription.id,
            });

            // Determine newly unlocked features
            const newFeatures = features.filter(f => !previousEnabled.includes(f));
            if (newFeatures.length > 0) {
              await Nexus.adapter.set(
                `tenants/${tenantId}/notifications/${crypto.randomUUID()}`,
                {
                  type: 'features_unlocked',
                  title: 'Nouvelles fonctionnalites disponibles',
                  message: `Plan ${plan} active. Nouveaux modules : ${newFeatures.join(', ')}`,
                  read: false,
                  createdAt: Date.now(),
                }
              );
            }

            logger.info(
              `[Stripe Webhook] Tenant ${tenantId} plan=${plan} features=[${features.join(',')}] (sub: ${subscription.id})`
            );
          } else {
            logger.warn(
              `[Stripe Webhook] Active subscription ${subscription.id} — unable to resolve plan tier`
            );
          }
          break;
        }

        // ── Subscription non-active or deleted → restrict tenant ──
        await Nexus.adapter.update(
          `tenants/${tenantId}`,
          { status: 'RESTRICTED', restrictedSince: Date.now() },
          { vassalId: tenantId, actorId: 'stripe-webhook' }
        );

        logger.info(
          `[Stripe Webhook] Tenant ${tenantId} restreint (event: ${event.type}, sub: ${subscription.id})`
        );

        // ── P12-E: emit tenant.subscription_expired for GracePeriodHandler ──
        if (event.type === 'customer.subscription.deleted') {
          // NexusEventBus is client-side; in SSR context we persist the event
          // directly so the GracePeriodHandler can pick it up on next client load.
          await Nexus.adapter.set(
            `tenants/${tenantId}/events/subscription_expired_${Date.now()}`,
            {
              type: 'tenant.subscription_expired',
              v: 1,
              tenantId,
              expiredAt: new Date().toISOString(),
              processed: false,
              createdAt: Date.now(),
            }
          );

          // Also create a notification for the tenant
          await Nexus.adapter.set(
            `tenants/${tenantId}/notifications/${crypto.randomUUID()}`,
            {
              type: 'subscription_expired',
              title: 'Abonnement expire',
              message: 'Votre abonnement a expire. Une periode de grace de 7 jours est active.',
              read: false,
              createdAt: Date.now(),
            }
          );

          logger.info(
            `[Stripe Webhook] tenant.subscription_expired persisted for tenant ${tenantId} (grace period)`
          );
        }

        // Kill switch MDM : verrouiller les iPads du tenant (fire-and-forget)
        if (process.env.MOSYLE_API_KEY) {
          void (async () => {
            try {
              const assignment = await Nexus.adapter.get(`mcc/deviceAssignments/${tenantId}`) as { serialNumbers?: string[] } | null;
              const serials = assignment?.serialNumbers ?? [];
              await Promise.all(serials.map(sn => MosyleClient.lockDevice(sn)));
              if (serials.length > 0) {
                logger.info(`[MDM Kill Switch] ${serials.length} device(s) verrouillé(s) pour tenant ${tenantId}`);
              }
            } catch (err) {
              logger.error(`[MDM Kill Switch] Erreur verrouillage devices tenant ${tenantId}`, err);
            }
          })();
        }

        break;
      }

      case 'payment_intent.payment_failed':
      case 'invoice.payment_failed': {
        const obj = event.data.object as unknown as Record<string, unknown>;
        const tenantId = (obj.metadata as Record<string, unknown>)?.tenantId as string || 'tenant_default';
        const amount = (obj.amount_due ?? obj.amount ?? 0) as number * 10000;

        const payload = {
          v: 1 as const,
          tenantId,
          invoiceId: (obj.id as string) || `inv_${Date.now()}`,
          customerId: (obj.customer as string) || `cust_${tenantId}`,
          amountInMicrounits: amount,
          reason: (obj.last_payment_error as { message?: string })?.message ?? 'Échec paiement Stripe',
        };

        // 1. Émission directe sur ServerEventBus (déclenche FleetOutboxHandler)
        await dispatchServerEvent('finance.payment_failed', payload);

        // 2. Persistance d'événements
        await Nexus.adapter.set(
          `tenants/${tenantId}/events/payment_failed_${Date.now()}`,
          payload
        );

        logger.warn(`[Stripe Webhook] finance.payment_failed émis et outboxé pour tenant ${tenantId}`);
        break;
      }

      default:
        logger.info(`[Stripe Webhook] Event non géré: ${event.type}`);
    }
  } catch (error) {
    logger.error('[Stripe Webhook] Erreur traitement event', error);
    // Retourner 200 à Stripe même en cas d'erreur interne pour éviter les retries infinis
    return NextResponse.json({ received: true, error: 'Erreur interne' });
  }

  return NextResponse.json({ received: true });
}
