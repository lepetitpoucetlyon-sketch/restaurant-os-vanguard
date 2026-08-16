import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { MaintenanceAlertConfigService } from '@/modules/facility/services/MaintenanceAlertConfigService';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const config = await MaintenanceAlertConfigService.getConfig(caller.tenantId);
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    logger.error('[API Maintenance Settings] Error fetching config', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    const updated = await MaintenanceAlertConfigService.updateConfig(
      caller.tenantId,
      body,
      caller.uid || 'manager'
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error('[API Maintenance Settings] Error updating config', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 400 });
  }
}
