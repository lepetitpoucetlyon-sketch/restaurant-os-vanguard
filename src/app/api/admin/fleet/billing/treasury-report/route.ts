/**
 * GET /api/admin/fleet/billing/treasury-report
 *
 * Retourne le rapport financier réel de la flotte MCC.
 * Source : Stripe API si STRIPE_SECRET_KEY est défini, sinon estimation Firestore.
 *
 * Protégé : fleet_admin minimum.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { BillingService } from '@/modules/finance/services/BillingService';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const report = await BillingService.getFleetTreasuryReport();
  return NextResponse.json(report);
}
