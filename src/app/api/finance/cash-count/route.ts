import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { requireUnlockedPeriod } from '@/lib/server/fiscalLockGuard';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  const lockDenied = await requireUnlockedPeriod(caller.tenantId, Date.now());
  if (lockDenied) return lockDenied;

  const body = await req.json();
  const { drawerId, expectedAmountInMicrounits, actualAmountInMicrounits, countedBy } = body;

  await NexusEventBus.emitDurable('finance.cash_counted', {
    v: 1,
    tenantId: caller.tenantId,
    drawerId,
    expectedAmountInMicrounits,
    actualAmountInMicrounits,
    countedBy
  });

  return NextResponse.json({ success: true });
}

