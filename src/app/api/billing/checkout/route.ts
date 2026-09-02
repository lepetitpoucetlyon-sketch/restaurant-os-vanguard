import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { getStripePriceId } from '@/shared/constants/pricing';
import type { PricingTier } from '@/shared/constants/pricing';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * POST /api/billing/checkout
 * Crée une Stripe Checkout Session pour le tenant authentifié.
 * Auth : admin/manager du tenant (ou super_admin).
 *
 * Body: { tier: 'STANDARD'|'PREMIUM'|'ENTERPRISE', annual?: boolean, successUrl: string, cancelUrl: string }
 * Returns: { url: string }
 */

const VALID_TIERS: PricingTier[] = ['STANDARD', 'PREMIUM', 'ENTERPRISE'];

export async function POST(request: NextRequest) {
    const caller = await requireTenantAdmin(request);
    if (isDenied(caller)) return caller;
    const { tenantId, uid } = caller;

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
        logger.error('[billing/checkout] STRIPE_SECRET_KEY manquant');
        return NextResponse.json({ error: 'Stripe non configuré.' }, { status: 503 });
    }

    let body: { tier?: string; annual?: boolean; successUrl?: string; cancelUrl?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });
    }

    const tier = (body.tier ?? 'STANDARD').toUpperCase() as PricingTier;
    if (!VALID_TIERS.includes(tier)) {
        return NextResponse.json({ error: `Tier inconnu : ${body.tier}. Valides : ${VALID_TIERS.join(', ')}` }, { status: 400 });
    }

    const priceId = getStripePriceId(tier);
    if (!priceId) {
        logger.error(`[billing/checkout] STRIPE_PRICE_${tier} manquant dans les variables d'env`);
        return NextResponse.json({ error: `Prix Stripe non configuré pour le tier ${tier}.` }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const successUrl = body.successUrl ?? `${appUrl}/settings?tab=billing&status=success`;
    const cancelUrl  = body.cancelUrl  ?? `${appUrl}/settings?tab=billing&status=cancelled`;

    try {
        const stripe = new Stripe(secret, { apiVersion: '2026-08-26.dahlia' });

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url:  cancelUrl,
            metadata: {
                tenantId,
                uid,
                tier,
                annual: String(body.annual ?? false),
            },
            // 30 min de validité (défaut Stripe = 24h, réduire pour la sécurité)
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        logger.info(`[billing/checkout] Session créée`, { tenantId, tier, sessionId: session.id });
        return NextResponse.json({ url: session.url });
    } catch (err) {
        logger.error('[billing/checkout] Stripe error', toError(err).message);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur Stripe.' },
            { status: 500 }
        );
    }
}
