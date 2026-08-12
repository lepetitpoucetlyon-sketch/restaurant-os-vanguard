import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { getStripePriceId } from '@/lib/constants/pricing';
import type { PricingTier } from '@/lib/constants/pricing';
import { toError } from "@/lib/toError";

/**
 * POST /api/billing/signup
 *
 * Route publique (sans auth) — point d'entrée B2B d'un nouveau client.
 * Crée une Stripe Checkout Session avec toutes les métadonnées de provisionnement
 * embarquées. Quand le paiement réussit, Stripe envoie checkout.session.completed
 * au webhook → TenantProvisioningService crée le restaurant automatiquement.
 *
 * Body:
 *   companyName  string  — Nom de l'établissement
 *   siret        string  — SIRET (14 chiffres, identifiant unique du tenant)
 *   ownerEmail   string  — Email du futur propriétaire (recevra le PIN)
 *   ownerName?   string  — Prénom + Nom du propriétaire
 *   tier?        'STANDARD' | 'PREMIUM' | 'ENTERPRISE'  (défaut : STANDARD)
 *   primaryColor? string — Couleur hex du branding (ex: '#C5A059')
 *   successUrl?  string
 *   cancelUrl?   string
 *
 * Returns: { url: string } — URL Stripe Checkout à rediriger
 */

const VALID_TIERS: PricingTier[] = ['STANDARD', 'PREMIUM', 'ENTERPRISE'];
const SIRET_RE = /^\d{14}$/;

export async function POST(request: NextRequest) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
        logger.error('[billing/signup] STRIPE_SECRET_KEY manquant');
        return NextResponse.json({ error: 'Stripe non configuré.' }, { status: 503 });
    }

    let body: {
        companyName?: string;
        siret?: string;
        ownerEmail?: string;
        ownerName?: string;
        tier?: string;
        primaryColor?: string;
        successUrl?: string;
        cancelUrl?: string;
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Payload JSON invalide.' }, { status: 400 });
    }

    const { companyName, siret, ownerEmail, ownerName, primaryColor } = body;

    if (!companyName?.trim()) {
        return NextResponse.json({ error: 'companyName requis.' }, { status: 400 });
    }
    if (!siret || !SIRET_RE.test(siret)) {
        return NextResponse.json({ error: 'siret invalide (14 chiffres requis).' }, { status: 400 });
    }
    if (!ownerEmail?.includes('@')) {
        return NextResponse.json({ error: 'ownerEmail invalide.' }, { status: 400 });
    }

    const tier = ((body.tier ?? 'STANDARD').toUpperCase()) as PricingTier;
    if (!VALID_TIERS.includes(tier)) {
        return NextResponse.json({ error: `Tier inconnu : ${body.tier}` }, { status: 400 });
    }

    const priceId = getStripePriceId(tier);
    if (!priceId) {
        logger.error(`[billing/signup] STRIPE_PRICE_${tier} manquant dans les variables d'env`);
        return NextResponse.json({ error: `Prix Stripe non configuré pour le tier ${tier}.` }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const successUrl = body.successUrl ?? `${appUrl}/welcome?status=success`;
    const cancelUrl  = body.cancelUrl  ?? `${appUrl}/pricing?status=cancelled`;

    try {
        const stripe = new Stripe(secret, { apiVersion: '2026-06-24.dahlia' });

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: ownerEmail,
            success_url: successUrl,
            cancel_url:  cancelUrl,
            // Toutes les données nécessaires au provisionnement embarquées ici.
            // Le webhook les retrouve dans session.metadata après paiement.
            metadata: {
                companyName: companyName.trim(),
                siret,
                ownerEmail,
                ownerName: ownerName?.trim() ?? '',
                planId: tier === 'ENTERPRISE' ? 'PREMIUM' : tier, // TenantProvisioningService accepte STANDARD|PREMIUM
                primaryColor: primaryColor ?? '#6366f1',
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        logger.info(`[billing/signup] Session Checkout B2B créée`, { siret, tier, sessionId: session.id });
        return NextResponse.json({ url: session.url });
    } catch (err) {
        logger.error('[billing/signup] Stripe error', toError(err).message);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur Stripe.' },
            { status: 500 },
        );
    }
}
