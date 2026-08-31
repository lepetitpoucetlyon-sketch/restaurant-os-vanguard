/**
 * POST /api/admin/dlq/replay-batch
 * Rejoue en lot tous les événements DLQ d'un handler donné (post fix root cause).
 *
 * RBAC : mcc_support (même niveau que replay unitaire).
 *
 * Body :
 *   {
 *     handlerId: string,         // ex: 'FinancialReconciliationHandler'
 *     tenantId?: string,         // optionnel — restreint à un tenant
 *     statusFilter?: 'retry'|'quarantine'|'all',   // default = quarantine
 *     limit?: number,            // default 50, max 200
 *     transformPayload?: 'skip' | 'wrap_v2',  // migration payload optionnelle
 *     dryRun?: boolean,          // si true : liste les candidats sans rejouer
 *   }
 *
 * Réponse :
 *   { processed, succeeded, failed, remaining, errors: [{ eventId, error }] }
 *
 * ADR-014 chantier 4 — Batch replay.
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus, type NexusEventName } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

interface DlqEntry {
    id: string;
    eventName: string;
    handlerId: string;
    tenantId: string;
    attempts: number;
    status: 'retry' | 'quarantine';
    payload: Record<string, unknown>;
    failedAt: number;
}

interface BatchReplayBody {
    handlerId?: string;
    tenantId?: string;
    statusFilter?: 'retry' | 'quarantine' | 'all';
    limit?: number;
    transformPayload?: 'skip' | 'wrap_v2';
    dryRun?: boolean;
}

const MAX_LIMIT = 200;

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;

    let body: BatchReplayBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    if (!body.handlerId || typeof body.handlerId !== 'string') {
        return NextResponse.json({ error: 'handlerId requis' }, { status: 400 });
    }

    const statusFilter = body.statusFilter ?? 'quarantine';
    const limit = Math.min(Math.max(1, body.limit ?? 50), MAX_LIMIT);
    const dryRun = body.dryRun === true;

    // 1. Charger les candidats
    let candidates: DlqEntry[] = [];
    try {
        const path = body.tenantId
            ? `tenants/${body.tenantId}/dead_letter_events`
            : 'dead_letter_events'; // fallback collectionGroup côté serveur
        const all = (await Nexus.adapter.query<DlqEntry>(path)) ?? [];
        candidates = all
            .filter(e => e.handlerId === body.handlerId)
            .filter(e => statusFilter === 'all' || e.status === statusFilter)
            .sort((a, b) => a.failedAt - b.failedAt)
            .slice(0, limit);
    } catch (err) {
        logger.error('[dlq/replay-batch] Lecture échouée', toError(err).message);
        return NextResponse.json({ error: `Lecture DLQ échouée : ${toError(err).message}` }, { status: 500 });
    }

    if (dryRun) {
        return NextResponse.json({
            dryRun: true,
            handlerId: body.handlerId,
            candidates: candidates.length,
            eventIds: candidates.map(c => c.id),
        });
    }

    // 2. Replay séquentiel (pour respecter l'ordre chronologique)
    const errors: Array<{ eventId: string; error: string }> = [];
    let succeeded = 0;
    let failed = 0;

    for (const entry of candidates) {
        try {
            let payload = entry.payload;
            if (body.transformPayload === 'wrap_v2') {
                payload = { v: 2, wrapped: entry.payload };
            }
            await NexusEventBus.emit(entry.eventName as NexusEventName, payload as never);

            const path = `tenants/${entry.tenantId}/dead_letter_events/${entry.id}`;
            await Nexus.adapter.delete(path);
            succeeded++;
        } catch (err) {
            failed++;
            errors.push({ eventId: entry.id, error: toError(err).message });
        }
    }

    // 3. Audit trail — traçabilité opérateur
    try {
        const { AuditLogger } = await import('@/modules/compliance/securite/AuditLogger');
        await AuditLogger.logAction(
            caller.uid,
            'CROSS_SCOPE_REVEAL', // action générique fanout — pourrait être renommée en DLQ_BATCH_REPLAY dans un futur ADR
            body.handlerId,
            {
                handlerId: body.handlerId,
                tenantId: body.tenantId,
                statusFilter,
                processed: candidates.length,
                succeeded,
                failed,
                transformPayload: body.transformPayload ?? 'skip',
            },
        );
    } catch (err) {
        logger.warn('[dlq/replay-batch] Audit trail échoué (non bloquant)', toError(err).message);
    }

    logger.info(
        `[dlq/replay-batch] handler=${body.handlerId} processed=${candidates.length} success=${succeeded} fail=${failed} by ${caller.uid}`,
    );

    return NextResponse.json({
        handlerId: body.handlerId,
        processed: candidates.length,
        succeeded,
        failed,
        remaining: candidates.length - succeeded,
        errors,
        replayedBy: caller.uid,
        replayedAt: new Date().toISOString(),
    });
}
