import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus } from '@orchestration/NexusEventBus';

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { itemId, oldQuantity, newQuantity, reason, adjustedBy } = body;

  await NexusEventBus.emitDurable('inventory.stock_adjusted', {
    v: 1,
    tenantId: caller.tenantId,
    itemId,
    oldQuantity,
    newQuantity,
    reason,
    adjustedBy
  });

  return NextResponse.json({ success: true });
}
