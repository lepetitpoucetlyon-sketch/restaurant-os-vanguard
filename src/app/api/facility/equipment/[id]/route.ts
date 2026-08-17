import { NextResponse } from 'next/server';
import { requireTenantRole, requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { EquipmentAssetService } from '@/modules/facility';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  try {
    const { id } = await params;
    const asset = await EquipmentAssetService.getAssetById(caller.tenantId, id);
    if (!asset) {
      return NextResponse.json({ success: false, error: 'Équipement introuvable' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    logger.error('[API Equipment ID] Error fetching asset', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await EquipmentAssetService.updateAsset(caller.tenantId, id, body, caller.uid);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error('[API Equipment ID] Error updating asset', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireTenantRole(req, 'directeur');
  if (isDenied(caller)) return caller;

  try {
    const { id } = await params;
    const decommissioned = await EquipmentAssetService.updateAsset(
      caller.tenantId,
      id,
      { status: 'DECOMMISSIONED' },
      caller.uid
    );
    return NextResponse.json({ success: true, data: decommissioned });
  } catch (error) {
    logger.error('[API Equipment ID] Error decommissioning asset', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 400 });
  }
}
