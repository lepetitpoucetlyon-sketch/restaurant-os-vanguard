import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { MaintenanceAlertConfigService, type RestaurantZone, type MaintenanceAlertType } from '@/modules/facility';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    const alertType: MaintenanceAlertType = body.alertType || 'EQUIPMENT_BREAKDOWN';
    const severity = body.severity || 'critical';
    const zone: RestaurantZone = body.zone || 'ALL';
    const equipmentName = body.equipmentName || 'Machine Test (Four Mixte Rational)';

    const result = await MaintenanceAlertConfigService.dispatchAlert({
      tenantId: caller.tenantId,
      alertType,
      severity,
      zone,
      equipmentName,
      message: `[TEST SYSTÈME] Alerte simulée depuis les Réglages Maintenance (Zone: ${zone})`,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('[API Maintenance Test Alert] Error dispatching test alert', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
  }
}
