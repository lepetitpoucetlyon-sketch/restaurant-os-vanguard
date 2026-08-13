import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * POST /api/admin/fleet/dlq/[id]/retry
 * Rejoue un événement en erreur depuis l'outbox tenant.
 * Accès : fleet_admin.
 *
 * Body : { tenantId: string }
 */

const BodySchema = z.object({ tenantId: z.string().min(1) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const caller = await requireMccLevel(request, 'fleet_admin');
    if (isDenied(caller)) return caller as NextResponse;

    const { id } = await params;
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }
    const { tenantId } = parsed.data;

    const entry = await Nexus.adapter.get<{
      id: string;
      type?: string;
      eventName?: string;
      payload?: Record<string, unknown>;
      status: string;
    }>(`tenants/${tenantId}/mcc_outbox/${id}`);

    if (!entry) return NextResponse.json({ error: 'Entrée DLQ introuvable' }, { status: 404 });
    if (entry.status === 'dispatched') {
      return NextResponse.json({ error: 'Entrée déjà traitée' }, { status: 409 });
    }

    const eventName = (entry.type ?? entry.eventName) as string;
    if (!eventName || !entry.payload) {
      return NextResponse.json({ error: 'Entrée invalide — eventName ou payload manquant' }, { status: 422 });
    }

    await NexusEventBus.emit(eventName as Parameters<typeof NexusEventBus.emit>[0], entry.payload as never);

    await Nexus.adapter.update(`tenants/${tenantId}/mcc_outbox/${id}`, {
      status: 'retried',
      retriedAt: new Date().toISOString(),
    });

    logger.info(`[DLQ] Retried event ${eventName} for tenant ${tenantId} (outbox entry ${id})`);
    return NextResponse.json({ ok: true, eventName, tenantId, entryId: id });
  } catch (err) {
    logger.error('[DLQ] retry', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/fleet/dlq/[id]/retry
 * Archive une entrée done_no_consumer légitime.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const caller = await requireMccLevel(request, 'fleet_admin');
    if (isDenied(caller)) return caller as NextResponse;

    const { id } = await params;
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');
    if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

    await Nexus.adapter.update(`tenants/${tenantId}/mcc_outbox/${id}`, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });

    logger.info(`[DLQ] Archived outbox entry ${id} for tenant ${tenantId}`);
    return NextResponse.json({ ok: true, archived: id });
  } catch (err) {
    logger.error('[DLQ] archive', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
