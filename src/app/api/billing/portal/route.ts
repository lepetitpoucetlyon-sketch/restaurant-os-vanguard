/**
 * POST /api/billing/portal
 * Ouvre le portail de facturation Stripe pour le tenant AUTHENTIFIÉ.
 * Auth : admin/manager du tenant (ou opérateur MCC fleet) — `requireTenantAdmin`.
 *
 * Raison d'être : le moteur de dunning (`/api/billing/dunning`) peut faire passer
 * un tenant en `licenceStatus: 'LOCKED'`, ce qui monte l'écran `SovereignLock`
 * par-dessus toute l'application. Sans cette route, le gérant verrouillé n'a
 * AUCUN moyen de régulariser : l'écran de blocage était une impasse.
 * La route MCC `/api/admin/fleet/billing/portal-session` exige `mcc_super_admin`
 * et n'est donc pas atteignable par le gérant.
 *
 * Body    : { returnUrl?: string }
 * Returns : { url: string }
 * Errors  : 503 si STRIPE_SECRET_KEY absent ou si le tenant n'a pas de client Stripe.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/payments/stripeClient';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import type { JsonObject } from '@/shared/types/json';

export async function POST(request: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(request);
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
        logger.error('[billing/portal] STRIPE_SECRET_KEY manquant');
        return NextResponse.json(
            { error: 'La facturation en ligne n\'est pas configurée sur ce déploiement. Contactez le support.' },
            { status: 503 },
        );
    }

    let body: { returnUrl?: string } = {};
    try {
        body = await request.json() as { returnUrl?: string };
    } catch {
        // Corps optionnel : un POST sans payload est valide.
    }

    const config = await Nexus.adapter.get(`tenants/${tenantId}/config`) as JsonObject | null;
    const stripeCustomerId = (config?.billing as JsonObject | undefined)?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
        logger.warn(`[billing/portal] Aucun stripeCustomerId pour ${tenantId}`);
        return NextResponse.json(
            { error: 'Aucun dossier de facturation n\'est rattaché à cet établissement. Contactez le support.' },
            { status: 503 },
        );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    // On n'accepte qu'une URL de retour interne : une returnUrl fournie par le client
    // ne doit pas pouvoir rediriger le gérant vers un domaine tiers après paiement.
    const requested = body.returnUrl;
    const returnUrl = requested && requested.startsWith(appUrl) ? requested : `${appUrl}/settings?tab=billing`;

    try {
        const stripe = getStripe(secret);
        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: returnUrl,
        });

        logger.info('[billing/portal] Session portail créée', { tenantId });
        return NextResponse.json({ url: session.url });
    } catch (err) {
        logger.error('[billing/portal] Stripe error', toError(err).message);
        return NextResponse.json(
            { error: 'Le portail de facturation est momentanément indisponible. Réessayez ou contactez le support.' },
            { status: 502 },
        );
    }
}
