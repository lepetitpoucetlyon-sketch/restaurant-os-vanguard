import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { ImportSnapshotService } from '@/modules/commerce/acquisition/onboarding/migration/ImportSnapshotService';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * ⚠️ Ancrage tenant : passer `caller.tenantId` EXPLICITEMENT au service.
 *
 * Ne jamais utiliser `Nexus.tenantOverride` ici : le singleton `Nexus` est partagé
 * par toutes les requêtes concurrentes du même process Node. Entre l'affectation et
 * le premier `await`, une requête d'un autre tenant peut écraser l'ancrage — la
 * restauration part alors dans les données du mauvais client.
 */

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

  const tenantId = caller.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant non résolu' }, { status: 403 });
  }

  try {
    await ImportSnapshotService.restore(snapshotId, tenantId);

    if (deleteSnapshot) {
      await ImportSnapshotService.delete(snapshotId, tenantId);
    }

    logger.info('[onboarding/rollback] Snapshot restauré', { snapshotId, tenantId });
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

  const tenantId = caller.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant non résolu' }, { status: 403 });
  }

  try {
    const snapshots = await ImportSnapshotService.list(
      tenantId,
      category as Parameters<typeof ImportSnapshotService.list>[1]
    );
    return NextResponse.json({ snapshots });
  } catch (err) {
    const message = toError(err).message;
    logger.error('[onboarding/rollback GET]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
