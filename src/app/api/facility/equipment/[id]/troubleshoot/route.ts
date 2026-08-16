import { NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { EquipmentDiagnosticService, EquipmentAssetService } from '@/modules/facility';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  try {
    const asset = await EquipmentAssetService.getAssetById(caller.tenantId, params.id);
    if (!asset) {
      return NextResponse.json({ success: false, error: 'Équipement introuvable' }, { status: 404 });
    }

    const body = await req.json();
    const { errorCode, symptom, createBreakdownTicket } = body;

    const result = await EquipmentDiagnosticService.diagnoseAndReport(caller.tenantId, params.id, {
      category: asset.category,
      errorCode,
      symptom: symptom || 'Anomalie signalée',
      operatorId: caller.uid,
      createBreakdownTicket: !!createBreakdownTicket,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('[API Troubleshoot] Error running diagnostic', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
  }
}
