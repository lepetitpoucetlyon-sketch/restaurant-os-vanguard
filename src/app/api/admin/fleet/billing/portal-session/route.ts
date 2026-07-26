/**
 * POST /api/admin/fleet/billing/portal-session
 * Crée une Stripe Billing Portal Session pour un tenant.
 * Auth : fleet_admin (MCC) ou admin/manager du tenant.
 *
 * Body : { tenantId: string, returnUrl: string }
 * Returns : { url: string }
 * Errors  : 503 si STRIPE_SECRET_KEY absent ou stripeCustomerId non configuré.
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn('[portal-session] STRIPE_SECRET_KEY absent — portal indisponible');
    return NextResponse.json(
      { error: 'Stripe non configuré sur ce déploiement.' },
      { status: 503 },
    );
  }

  const body = await req.json() as { tenantId?: string; returnUrl?: string };
  const { tenantId, returnUrl } = body;

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
  }

  const tenantConfig = await Nexus.adapter.get(`tenants/${tenantId}/config`) as Record<string, unknown> | null;
  const stripeCustomerId = (tenantConfig?.billing as Record<string, unknown> | undefined)?.stripeCustomerId as string | undefined;

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'Aucun stripeCustomerId trouvé pour ce tenant.' },
      { status: 503 },
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl ?? process.env.NEXT_PUBLIC_MCC_URL ?? 'https://app.restaurant-os.com',
  });

  logger.info(`[portal-session] Session créée pour tenant ${tenantId}`);
  return NextResponse.json({ url: session.url });
}
