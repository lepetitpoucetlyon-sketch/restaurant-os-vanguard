import 'server-only';
import { FiscalSealer } from "@/modules/finance";
/**
 * Acompte privatisation/groupe — res-14
 *
 * Crée une session Stripe Checkout pour collecter un acompte sur
 * une réservation de privatisation ou de groupe.
 * L'acompte encaissé crée automatiquement un JournalEntry + FiscalSeal NF525.
 *
 * POST /api/reservations/deposit/create
 *   Body: { reservationId: string; amountInMicrounits: number; description?: string }
 *   Retourne: { sessionId: string; checkoutUrl: string }
 *
 * POST /api/reservations/deposit/confirm (webhook Stripe)
 *   Vérifie HMAC, crée JournalEntry + FiscalSeal si checkout.session.completed
 *
 * Protégé : requireTenantAdmin pour create. Webhook = signature Stripe.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import { getStripe } from '@/lib/payments/stripeClient';
import { toError } from "@/lib/toError";

const MICROUNITS_PER_CENT = 10; // 1 microunit = 0.000001€, 1 cent = 0.01€ = 10 000 µ

const createDepositHandler = withTenantRoute(
  async (req, { tenantId }) => {
    let body: { reservationId: string; amountInMicrounits: number; description?: string };
    try {
      body = await req.json() as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { reservationId, amountInMicrounits, description = 'Acompte privatisation' } = body;
    if (!reservationId || !amountInMicrounits) {
      return NextResponse.json({ error: 'reservationId et amountInMicrounits requis' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY non configuré' }, { status: 503 });
    }

    const stripe     = getStripe(stripeKey);
    const amountCents = Math.round(amountInMicrounits / MICROUNITS_PER_CENT);
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.restaurantos.app';

    const session = await stripe.checkout.sessions.create({
      mode:        'payment',
      line_items:  [{
        price_data: {
          currency:     'eur',
          unit_amount:  amountCents,
          product_data: { name: description },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/reservations/${reservationId}?deposit=success`,
      cancel_url:  `${appUrl}/reservations/${reservationId}?deposit=cancelled`,
      metadata:    { tenantId, reservationId, amountInMicrounits: String(amountInMicrounits) },
    });

    await Nexus.adapter.set(`tenants/${tenantId}/reservations/${reservationId}`, {
      depositStatus:   'pending',
      depositSessionId: session.id,
      depositAmountInMicrounits: amountInMicrounits,
    }, { merge: true });

    logger.info(`[Deposit] Session Stripe ${session.id} créée pour réservation ${reservationId}`);
    return NextResponse.json({ sessionId: session.id, checkoutUrl: session.url });
  },
  { requireAdmin: true },
);

export async function POST(req: NextRequest): Promise<Response | NextResponse> {
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'confirm') {
    return handleStripeWebhook(req);
  }

  return createDepositHandler(req);
}

async function handleStripeWebhook(req: NextRequest): Promise<NextResponse> {
  const stripeKey    = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_DEPOSIT_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const rawBody  = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    const stripe = getStripe(stripeKey);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logger.warn(`[Deposit/webhook] Signature invalide: ${toError(err).message}`);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session;
    const tenantId = session.metadata?.tenantId;
    const reservationId = session.metadata?.reservationId;
    const amountInMicrounits = Number(session.metadata?.amountInMicrounits ?? 0);

    if (!tenantId || !reservationId) {
      return NextResponse.json({ received: true });
    }

    // JournalEntry NF525
    const jeId = Nexus.adapter.generateId(`tenants/${tenantId}/journalEntries`);
    const journalEntry = {
      id:              jeId,
      date:            new Date().toISOString().slice(0, 10),
      label:           `Acompte privatisation — réservation ${reservationId}`,
      amountInMicrounits,
      type:            'credit' as const,
      pcgAccount:      '4119',
      pcgLabel:        'Acomptes reçus clients',
      source:          'stripe_deposit' as const,
      stripeSessionId: session.id,
      reservationId,
      createdAt:       new Date().toISOString(),
    };

    // 🛡️ Idempotence Stripe : vérification préalable
    const stripeEventDoc = await Nexus.adapter.get(`tenants/${tenantId}/stripeEvents/${event.id}`);
    if (stripeEventDoc) {
      logger.info(`[Deposit] Événement Stripe ${event.id} déjà traité (idempotent)`);
      return NextResponse.json({ received: true, idempotent: true });
    }

    const dataSnapshot = CryptoService.canonicalStringify(
      journalEntry
    );

    const seal = await FiscalSealer.sealDataAtomically(
      dataSnapshot,
      tenantId,
      false,
      journalEntry,
      (tx, sealId) => {
        tx.set(`tenants/${tenantId}/stripeEvents/${event.id}`, {
          eventId: event.id,
          sessionId: session.id,
          reservationId,
          journalEntryId: jeId,
          sealId,
          processedAt: new Date().toISOString(),
        });
        tx.update(`tenants/${tenantId}/reservations/${reservationId}`, {
          depositStatus:   'paid',
          depositPaidAt:   new Date().toISOString(),
          depositJournalEntryId: jeId,
        });
      }
    );

    logger.info(`[Deposit] Acompte encaissé → JournalEntry ${jeId} + FiscalSeal ${seal.sealId}`);
  }

  return NextResponse.json({ received: true });
}
