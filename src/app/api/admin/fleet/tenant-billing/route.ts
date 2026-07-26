/**
 * GET /api/admin/fleet/tenant-billing?tenantId=xxx
 * Retourne les infos de facturation Nexus d'un tenant.
 * Protégé : mcc_support minimum.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

// Initialisation de Stripe (le SDK est présent)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia' as any,
});

interface TenantConfig {
  name?: string;
  billing?: {
    status?: string;
    plan?: string;
    nextBillingDate?: string;
    stripeCustomerId?: string;
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as TenantConfig | null;
  
  let realStatus = config?.billing?.status ?? 'unknown';
  let realNextDate = config?.billing?.nextBillingDate ?? null;
  let realPlan = config?.billing?.plan ?? 'STANDARD';

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
        realNextDate = new Date(sub.current_period_end * 1000).toISOString();
        
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

  return NextResponse.json({
    tenantId,
    name:             config?.name ?? tenantId,
    plan:             realPlan,
    status:           realStatus,
    nextBillingDate:  realNextDate,
    stripeCustomerId: config?.billing?.stripeCustomerId ?? null,
  });
}
