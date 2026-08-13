import { NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const caller = await requireTenantRole(req, 'serveur');
  if (isDenied(caller)) return caller;

  const body = await req.json();
  const { tableId, reason } = body as { tableId?: string; reason?: string };

  if (!tableId) {
    return NextResponse.json({ error: 'tableId requis' }, { status: 400 });
  }

  const lockedAt = Date.now();

  await NexusEventBus.emitDurable('table.locked', {
    v: 1,
    tenantId: caller.tenantId,
    tableId,
    lockedBy: caller.uid,
    reason: reason ?? 'manual_lock',
    lockedAt,
  });

  logger.info(`[TableLock] Table ${tableId} verrouillée par ${caller.uid}`);

  return NextResponse.json({ success: true, tableId, lockedAt });
}
