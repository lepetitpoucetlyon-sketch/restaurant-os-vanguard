import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * GET /api/admin/dlq/list
 * Liste les événements en Dead Letter Queue (server-side, tous tenants).
 * RBAC : mcc_support minimum (lecture support).
 * Query params :
 *   - tenantId (optionnel) : filtrer par tenant
 *   - status (optionnel)   : retry | quarantine (défaut = tous)
 *   - limit (optionnel)    : nombre max (défaut 100)
 *
 * @see Chantier I du PLAN_CONSOLIDATION (silence killer : DLQ visible)
 */
export async function GET(req: NextRequest) {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller;

  const { searchParams } = new URL(req.url);
  const filterTenant = searchParams.get('tenantId');
  const filterStatus = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);

  try {
    // Path Firestore serveur : tenants/{tid}/dead_letter_events/{id}
    // Pour lister cross-tenant : on utilise un collectionGroup query (ou fallback : par tenant)
    const path = filterTenant
      ? `tenants/${filterTenant}/dead_letter_events`
      : 'dead_letter_events'; // collectionGroup — adapter selon l'implémentation Nexus

    const entries = await Nexus.adapter.query<Record<string, unknown>>(path, {
      limit,
      where: filterStatus ? [{ field: 'status', operator: '==', value: filterStatus }] : undefined,
    });

    return NextResponse.json({
      count: entries.length,
      entries,
      caller: { uid: caller.uid, role: caller.role },
    });
  } catch (err) {
    logger.error('[dlq/list] error', toError(err).message);
    return NextResponse.json({ error: 'Erreur lecture DLQ' }, { status: 500 });
  }
}
