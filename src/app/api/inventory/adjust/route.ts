import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const AdjustSchema = z.object({
  itemId: z.string().min(1).max(120),
  oldQuantity: z.number(),
  newQuantity: z.number(),
  reason: z.string().min(1).max(500),
  adjustedBy: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  const parsed = AdjustSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalide', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await NexusEventBus.emitDurable('inventory.stock_adjusted', {
    v: 1,
    tenantId: caller.tenantId,
    ...parsed.data,
  });

  return NextResponse.json({ success: true });
}
