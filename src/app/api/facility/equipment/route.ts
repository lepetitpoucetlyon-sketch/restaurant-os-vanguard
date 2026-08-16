import { NextResponse } from 'next/server';
import { requireTenantRole, requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { EquipmentAssetService } from '@/modules/facility/services/EquipmentAssetService';
import { EquipmentKnowledgeService } from '@/modules/facility/services/EquipmentKnowledgeService';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  try {
    const assets = await EquipmentAssetService.getAllAssets(caller.tenantId);
    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    logger.error('[API Equipment] Failed to fetch assets', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    const asset = await EquipmentAssetService.registerAsset(caller.tenantId, body, caller.uid);

    // Auto-seed default guides for this category
    if (body.category) {
      await EquipmentKnowledgeService.seedDefaultGuidesForCategory(
        caller.tenantId,
        asset.id,
        body.category
      ).catch((e) => logger.warn('[API Equipment] Auto-seed guides error', toError(e).message));
    }

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    logger.error('[API Equipment] Failed to register asset', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 400 });
  }
}
