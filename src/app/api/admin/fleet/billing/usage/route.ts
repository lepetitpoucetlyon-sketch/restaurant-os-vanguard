/**
 * GET /api/admin/fleet/billing/usage?tenantId=xxx
 * Retourne le résumé d'usage (SMS, emails, IA) du mois courant pour un tenant.
 * Protégé : mcc_support minimum.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { UsageTracker } from '@/shared/nexus/engines/Ledger/billing/UsageTracker';
export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const summary = await UsageTracker.getSummary(tenantId);
  return NextResponse.json(summary);
}
