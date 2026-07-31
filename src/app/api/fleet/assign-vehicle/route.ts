import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { vehicleId, driverId, assignedAt } = body;

  await NexusEventBus.emitDurable('fleet.vehicle_assigned', {
    v: 1,
    tenantId: caller.tenantId,
    vehicleId,
    driverId,
    assignedAt
  });

  return NextResponse.json({ success: true });
}
