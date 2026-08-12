import { NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { dispatchServerEvent } from '@orchestration/ServerEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { userId, timestamp } = body;
  const clockTime = timestamp ?? Date.now();
  const entryId = `clock_${userId}_${clockTime}`;

  // Persistance dans shiftEntries pour harmonisation avec TimeclockDashboard (Item R9)
  await Nexus.adapter.set(`tenants/${caller.tenantId}/shiftEntries/${entryId}`, {
    id: entryId,
    userId,
    clockIn: new Date(clockTime).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  await dispatchServerEvent('hr.clock_in', {
    v: 1,
    tenantId: caller.tenantId,
    userId,
    timestamp: clockTime,
  });

  logger.info(`[ClockInAPI] Pointage entrant enregistré pour ${userId} dans shiftEntries (${entryId})`);

  return NextResponse.json({ success: true, entryId });
}
