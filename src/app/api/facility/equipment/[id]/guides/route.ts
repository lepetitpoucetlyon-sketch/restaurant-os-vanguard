import { NextResponse } from 'next/server';
import { requireTenantRole, requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { EquipmentKnowledgeService } from '@/modules/facility/services/EquipmentKnowledgeService';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  try {
    const guides = await EquipmentKnowledgeService.getGuidesForEquipment(caller.tenantId, params.id);
    return NextResponse.json({ success: true, data: guides });
  } catch (error) {
    logger.error('[API Guides] Error fetching guides', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    const guide = await EquipmentKnowledgeService.addGuide(caller.tenantId, params.id, body, caller.uid);
    return NextResponse.json({ success: true, data: guide }, { status: 201 });
  } catch (error) {
    logger.error('[API Guides] Error adding guide', toError(error).message);
    return NextResponse.json({ success: false, error: toError(error).message }, { status: 400 });
  }
}
