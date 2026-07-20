import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

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
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripeSubscription;
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

  if (STRIPE_WEBHOOK_SECRET) {
    const isValid = verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      logger.warn('[Stripe Webhook] Signature invalide — requête rejetée');
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
    }
  } else {
    logger.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET non configuré — vérification de signature ignorée');
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
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        // Ne traiter que les subscriptions non-actives pour 'updated'
        if (
          event.type === 'customer.subscription.updated' &&
          subscription.status === 'active'
        ) {
          break;
        }

        // Extraire le tenantId depuis les métadonnées de la subscription ou du customer
        const tenantId =
          subscription.metadata?.tenantId ??
          (typeof subscription.customer === 'object' && subscription.customer !== null
            ? subscription.customer.metadata?.tenantId
            : undefined);

        if (!tenantId) {
          logger.warn(
            `[Stripe Webhook] tenantId introuvable dans les métadonnées pour subscription ${subscription.id}`
          );
          break;
        }

        // Restreindre le tenant
        await Nexus.adapter.update(
          `tenants/${tenantId}`,
          { status: 'RESTRICTED', restrictedSince: Date.now() },
          { vassalId: tenantId, actorId: 'stripe-webhook' }
        );

        logger.info(
          `[Stripe Webhook] Tenant ${tenantId} restreint (event: ${event.type}, sub: ${subscription.id})`
        );
        break;
      }

      default:
        logger.info(`[Stripe Webhook] Event non géré: ${event.type}`);
    }
  } catch (error: unknown) {
    logger.error('[Stripe Webhook] Erreur traitement event', error);
    // Retourner 200 à Stripe même en cas d'erreur interne pour éviter les retries infinis
    return NextResponse.json({ received: true, error: 'Erreur interne' });
  }

  return NextResponse.json({ received: true });
}
