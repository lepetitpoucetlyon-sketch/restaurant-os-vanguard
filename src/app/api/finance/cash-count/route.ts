import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { requireUnlockedPeriod } from '@/lib/server/fiscalLockGuard';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const CashCountSchema = z.object({
  drawerId: z.string().min(1).max(120),
  expectedAmountInMicrounits: z.number().int().min(0),
  actualAmountInMicrounits: z.number().int().min(0),
  countedBy: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'comptable');
  if (isDenied(caller)) return caller;

  const lockDenied = await requireUnlockedPeriod(caller.tenantId, Date.now());
  if (lockDenied) return lockDenied;

  const parsed = CashCountSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalide', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await NexusEventBus.emitDurable('finance.cash_counted', {
    v: 1,
    tenantId: caller.tenantId,
    ...parsed.data,
  });

  return NextResponse.json({ success: true });
}
