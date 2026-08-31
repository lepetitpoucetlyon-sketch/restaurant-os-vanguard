/**
 * GET /api/admin/dlq/export
 * Export forensique de la DLQ pour audit externe.
 *
 * RBAC : mcc_super_admin (donnée sensible cross-tenant).
 *
 * Query params :
 *   tenantId?  — restreint à un tenant
 *   status?    — 'retry' | 'quarantine' | 'all' (default = 'quarantine')
 *
 * Réponse : JSON avec { entries, exportedAt, exportedBy, count } + audit trail.
 *
 * ADR-014 chantier 4 — Export forensique.
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
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
    error: string;
    failedAt: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'mcc_super_admin');
    if (isDenied(caller)) return caller as NextResponse;

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const statusFilter = (searchParams.get('status') ?? 'quarantine') as 'retry' | 'quarantine' | 'all';

    let entries: DlqEntry[] = [];
    try {
        const path = tenantId
            ? `tenants/${tenantId}/dead_letter_events`
            : 'dead_letter_events';
        const all = (await Nexus.adapter.query<DlqEntry>(path)) ?? [];
        entries = statusFilter === 'all'
            ? all
            : all.filter(e => e.status === statusFilter);
    } catch (err) {
        logger.error('[dlq/export] Lecture échouée', toError(err).message);
        return NextResponse.json({ error: `Export impossible : ${toError(err).message}` }, { status: 500 });
    }

    // Audit trail
    try {
        const { AuditLogger } = await import('@/modules/compliance/securite/AuditLogger');
        await AuditLogger.logAction(
            caller.uid,
            'FISCAL_ARCHIVE_EXPORT',
            'dlq-export',
            {
                tenantId,
                statusFilter,
                count: entries.length,
            },
        );
    } catch (err) {
        logger.warn('[dlq/export] Audit trail échoué (non bloquant)', toError(err).message);
    }

    logger.info(`[dlq/export] ${entries.length} entrées exportées par ${caller.uid}`);

    return NextResponse.json({
        entries,
        count: entries.length,
        tenantId,
        statusFilter,
        exportedAt: new Date().toISOString(),
        exportedBy: caller.uid,
    }, {
        headers: {
            'Content-Disposition': `attachment; filename="dlq-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
    });
}
