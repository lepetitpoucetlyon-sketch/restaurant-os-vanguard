/**
 * GET /api/admin/fleet/tenant-billing?tenantId=xxx
 * Retourne les infos de facturation Nexus d'un tenant.
 * Protégé : mcc_support minimum.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';

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

  return NextResponse.json({
    tenantId,
    name:             config?.name ?? tenantId,
    plan:             config?.billing?.plan ?? 'STANDARD',
    status:           config?.billing?.status ?? 'unknown',
    nextBillingDate:  config?.billing?.nextBillingDate ?? null,
    stripeCustomerId: config?.billing?.stripeCustomerId ?? null,
  });
}
