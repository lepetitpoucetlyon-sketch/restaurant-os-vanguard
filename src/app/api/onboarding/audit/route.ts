import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { RestaurantOnboardingMasterService } from '@/modules/commerce';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Seuls les rôles manager ou supérieurs peuvent consulter l'état d'audit global
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const summary = await RestaurantOnboardingMasterService.auditOnboarding(caller.tenantId);
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    logger.error('[API Onboarding Audit] Error auditing onboarding', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
  }
}
