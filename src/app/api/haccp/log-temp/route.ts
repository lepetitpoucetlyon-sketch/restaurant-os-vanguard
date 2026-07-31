import { NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export async function POST(req: Request) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { sensorId, temperature, unit, timestamp } = body;

  await NexusEventBus.emitDurable('haccp.temperature_logged', {
    v: 1,
    tenantId: caller.tenantId,
    sensorId,
    temperature,
    unit,
    timestamp
  });

  return NextResponse.json({ success: true });
}
