import 'server-only';
import { NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { dispatchServerEvent } from '@/shared/eventBus/ServerEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const CLOCK_DEBOUNCE_MS = 60_000;

export async function POST(req: Request) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { userId, timestamp } = body;
  const clockTime = timestamp ?? Date.now();

  // Anti-rebond 60s — Invariant #4 concurrence pointeuse
  const recentEntries = await Nexus.adapter.query<{ createdAt: string }>(
    `tenants/${caller.tenantId}/shiftEntries`,
    {
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 1,
    }
  );
  if (recentEntries.length > 0) {
    const lastMs = new Date(recentEntries[0].createdAt).getTime();
    const elapsed = clockTime - lastMs;
    if (elapsed < CLOCK_DEBOUNCE_MS) {
      logger.warn(`[ClockInAPI] Debounce: ${userId} a déjà pointé il y a ${elapsed}ms — rejeté`);
      return NextResponse.json(
        { success: false, reason: 'debounce', retryAfterMs: CLOCK_DEBOUNCE_MS - elapsed },
        { status: 429 }
      );
    }
  }

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
