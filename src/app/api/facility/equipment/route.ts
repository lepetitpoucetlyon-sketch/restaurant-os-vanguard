import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenantRole, requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { EquipmentAssetService, EquipmentKnowledgeService } from '@/modules/facility';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

const EquipmentSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(80).optional(),
  serialNumber: z.string().max(120).optional(),
  manufacturer: z.string().max(120).optional(),
  model: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  purchaseDate: z.string().optional(),
  purchasePriceInMicrounits: z.number().int().optional(),
  warrantyExpiryDate: z.string().optional(),
}).passthrough();

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
    const parsed = EquipmentSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Payload invalide', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    // Le service applique sa validation stricte de shape complète (EquipmentAssetSchema).
    // Zod ici garantit juste name obligatoire + limites longueurs (anti-flood).
    const body = parsed.data as Parameters<typeof EquipmentAssetService.registerAsset>[1];
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
