import { NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { dispatchServerEvent } from '@/shared/eventBus/ServerEventBus';

export async function POST(req: Request) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { userId, timestamp } = body;

  await dispatchServerEvent('hr.clock_in', {
    v: 1,
    tenantId: caller.tenantId,
    userId,
    timestamp
  });

  return NextResponse.json({ success: true });
}
