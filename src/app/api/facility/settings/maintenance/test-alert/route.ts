import { NextResponse, type NextRequest } from 'next/server';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { MaintenanceAlertConfigService, type RestaurantZone, type MaintenanceAlertType } from '@/modules/facility';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export const POST = withTenantRoute(
  async (req: NextRequest, ctx) => {
    try {
      const body = await req.json();
      const alertType: MaintenanceAlertType = body.alertType || 'EQUIPMENT_BREAKDOWN';
      const severity = body.severity || 'critical';
      const zone: RestaurantZone = body.zone || 'ALL';
      const equipmentName = body.equipmentName || 'Machine Test (Four Mixte Rational)';

      const result = await MaintenanceAlertConfigService.dispatchAlert({
        tenantId: ctx.tenantId,
        alertType,
        severity,
        zone,
        equipmentName,
        message: `[TEST SYSTÈME] Alerte simulée depuis les Réglages Maintenance (Zone: ${zone})`,
      });

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      logger.error('[API Maintenance Test Alert] Error dispatching test alert', { error: toError(error).message, correlationId: ctx.correlationId });
      return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
    }
  },
  { minRole: 'manager' },
);
