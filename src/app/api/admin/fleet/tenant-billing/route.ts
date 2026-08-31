/**
 * GET /api/admin/fleet/tenant-billing?tenantId=xxx
 * Retourne les infos de facturation Nexus d'un tenant.
 * Protégé : mcc_support minimum.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

// Initialisation de Stripe (le SDK est présent)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-06-24.dahlia',
});

interface TenantConfig {
  name?: string;
  billing?: {
    status?: string;
    plan?: string;
    nextBillingDate?: string;
    stripeCustomerId?: string;
  };
  plugins?: Record<string, { active?: boolean }>;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as TenantConfig | null;
  
  let realStatus = config?.billing?.status ?? 'unknown';
  let realNextDate = config?.billing?.nextBillingDate ?? null;
  const realPlan = config?.billing?.plan ?? 'STANDARD';

  // Consolidation MCC : Interrogation REELLE de Stripe
  if (config?.billing?.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: config.billing.stripeCustomerId,
        status: 'all',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        realStatus = sub.status === 'active' ? 'ACTIVE' : sub.status;
        // Depuis l'API Stripe 2025+ (SDK v22), `current_period_end` est porté par
        // chaque item d'abonnement, plus par l'objet Subscription lui-même.
        const periodEndUnix =
          sub.items?.data?.[0]?.current_period_end ??
          (sub as unknown as { current_period_end?: number }).current_period_end;
        realNextDate = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : realNextDate;
        
        // Synchroniser Firestore avec la réalité Stripe
        await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
            billing: {
                status: realStatus,
                nextBillingDate: realNextDate
            }
        }, { merge: true });
      }
    } catch (err) {
      logger.error(`[MCC/billing] Stripe fetch error for ${tenantId}`, err);
    }
  }

  const activePlugins = Object.entries(config?.plugins || {})
    .filter(([_, data]) => data.active)
    .map(([id]) => id);

  const catalogDoc = await Nexus.adapter.get('mcc/empire/plugin-catalog') as { items?: Record<string, { basePrice: number }> } | null;
  const dynamicCatalog = catalogDoc?.items || {};

  const monthlyExtraCost = activePlugins.reduce((acc, id) => {
    const price = dynamicCatalog[id]?.basePrice || 0;
    return acc + price;
  }, 0);

  return NextResponse.json({
    tenantId,
    name:             config?.name ?? tenantId,
    plan:             realPlan,
    status:           realStatus,
    nextBillingDate:  realNextDate,
    stripeCustomerId: config?.billing?.stripeCustomerId ?? null,
    activePlugins,
    monthlyExtraCost
  });
}
