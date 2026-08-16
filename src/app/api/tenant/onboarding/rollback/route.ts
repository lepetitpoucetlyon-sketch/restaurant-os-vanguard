import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ImportSnapshotService } from '@/modules/commerce';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

export async function POST(req: NextRequest) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const { snapshotId, deleteSnapshot = false } = await req.json() as {
    snapshotId: string;
    deleteSnapshot?: boolean;
  };

  if (!snapshotId) {
    return NextResponse.json({ error: 'snapshotId requis' }, { status: 400 });
  }

  try {
    Nexus.tenantOverride = caller.tenantId ?? null;
    await ImportSnapshotService.restore(snapshotId);

    if (deleteSnapshot) {
      await ImportSnapshotService.delete(snapshotId);
    }

    logger.info('[onboarding/rollback] Snapshot restauré', { snapshotId, tenantId: caller.tenantId });
    return NextResponse.json({ success: true, snapshotId, rolledBack: true });
  } catch (err) {
    const message = toError(err).message;
    logger.error('[onboarding/rollback]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const category = new URL(req.url).searchParams.get('category') ?? undefined;

  try {
    Nexus.tenantOverride = caller.tenantId ?? null;
    const snapshots = await ImportSnapshotService.list(
      category as Parameters<typeof ImportSnapshotService.list>[0]
    );
    return NextResponse.json({ snapshots });
  } catch (err) {
    const message = toError(err).message;
    logger.error('[onboarding/rollback GET]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
