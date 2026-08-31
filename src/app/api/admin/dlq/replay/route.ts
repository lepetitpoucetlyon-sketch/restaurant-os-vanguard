import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus, type NexusEventName } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * POST /api/admin/dlq/replay
 * Rejoue un événement depuis la Dead Letter Queue.
 * RBAC : mcc_senior_dev (action support impactante).
 * Body : { tenantId: string, eventId: string }
 *
 * Comportement :
 *   - success   → event supprimé de DLQ
 *   - fail      → attempt++ dans DLQ, statut inchangé
 *
 * Idempotence : garantie par IdempotencyGuard (dedup sur eventId) — sûr à cliquer 2 fois.
 *
 * @see Chantier I du PLAN_CONSOLIDATION
 */
export async function POST(req: NextRequest) {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller;

  let body: { tenantId?: string; eventId?: string };
  try {
    body = (await req.json()) as { tenantId?: string; eventId?: string };
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
  }

  if (!body.tenantId || !body.eventId) {
    return NextResponse.json(
      { error: 'tenantId et eventId sont requis' },
      { status: 400 }
    );
  }

  const path = `tenants/${body.tenantId}/dead_letter_events/${body.eventId}`;

  try {
    const entry = await Nexus.adapter.get<Record<string, unknown>>(path);
    if (!entry) {
      return NextResponse.json({ error: 'Événement DLQ introuvable' }, { status: 404 });
    }

    const eventName = entry.eventName as NexusEventName;
    const payload = entry.payload as Record<string, unknown>;

    // Rejoue via IdempotencyGuard (dedup automatique sur eventId).
    await NexusEventBus.emit(eventName, payload as never);

    // Supprime l'entrée DLQ (success)
    await Nexus.adapter.delete(path);

    logger.info(`[dlq/replay] ${eventName} rejoué avec succès par ${caller.uid}`);

    return NextResponse.json({
      success: true,
      eventName,
      replayedBy: caller.uid,
      replayedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[dlq/replay] error', toError(err).message);
    // On ne supprime PAS l'entrée en cas d'erreur — attempt++ géré par DLQRetryService
    return NextResponse.json(
      { error: `Replay échoué : ${toError(err).message}` },
      { status: 500 }
    );
  }
}
