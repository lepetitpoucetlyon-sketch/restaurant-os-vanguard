import { NextResponse, type NextRequest } from 'next/server';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { MaintenanceAlertConfigService } from '@/modules/facility';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export const GET = withTenantRoute(
  async (_req: NextRequest, ctx) => {
    try {
      const config = await MaintenanceAlertConfigService.getConfig(ctx.tenantId);
      return NextResponse.json({ success: true, data: config });
    } catch (error) {
      logger.error('[API Maintenance Settings] Error fetching config', { error: toError(error).message, correlationId: ctx.correlationId });
      return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
    }
  },
  { minRole: 'manager' },
);

export const PUT = withTenantRoute(
  async (req: NextRequest, ctx) => {
    try {
      const body = await req.json();
      const updated = await MaintenanceAlertConfigService.updateConfig(
        ctx.tenantId,
        body,
        ctx.caller.uid || 'manager',
      );
      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      logger.error('[API Maintenance Settings] Error updating config', { error: toError(error).message, correlationId: ctx.correlationId });
      return NextResponse.json({ success: false, error: toError(error).message }, { status: 400 });
    }
  },
  { minRole: 'manager' },
);
