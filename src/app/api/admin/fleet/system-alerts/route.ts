import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { QueryFilter } from '@nexus/contracts/infrastructure/storage.contracts';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * §8 Fleet Health — Alertes système uniquement (NF525, crypto, compliance, taux d'erreur)
 *
 * GET  /api/admin/fleet/system-alerts?tenantId=&status=open&category=nf525
 *   → Liste les alertes fleet pour un tenant (ou toutes si pas de tenantId)
 *
 * PATCH /api/admin/fleet/system-alerts/[id]
 *   → Acquitter une alerte (status: acknowledged)
 *
 * Accès : mcc_support minimum.
 */

const QuerySchema = z.object({
  tenantId: z.string().optional(),
  status: z.enum(['open', 'acknowledged', 'all']).default('open'),
  category: z.enum(['nf525', 'security', 'compliance', 'system', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(request: NextRequest) {
  try {
    const caller = await requireMccLevel(request, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;

    const url = new URL(request.url);
    const query = QuerySchema.safeParse({
      tenantId: url.searchParams.get('tenantId') ?? undefined,
      status: url.searchParams.get('status') ?? 'open',
      category: url.searchParams.get('category') ?? 'all',
      limit: url.searchParams.get('limit') ?? '50',
    });
    if (!query.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const { tenantId, status, category, limit } = query.data;
    const whereFilters: QueryFilter[] = [];

    if (status !== 'all') {
      whereFilters.push({ field: 'status', operator: '==', value: status });
    }
    if (category !== 'all') {
      whereFilters.push({ field: 'category', operator: '==', value: category });
    }
    if (tenantId) {
      whereFilters.push({ field: 'tenantId', operator: '==', value: tenantId });
    }

    const alerts = await Nexus.adapter.query('mcc/fleet/alerts', {
      where: whereFilters,
      limit,
    });

    return NextResponse.json({ count: alerts.length, alerts });
  } catch (err) {
    logger.error('[system-alerts] GET', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const caller = await requireMccLevel(request, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;

    const body = await request.json() as { id?: string };
    if (!body.id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    await Nexus.adapter.update(`mcc/fleet/alerts/${body.id}`, {
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString(),
    });

    logger.info(`[system-alerts] Alerte ${body.id} acquittée`);
    return NextResponse.json({ ok: true, acknowledged: body.id });
  } catch (err) {
    logger.error('[system-alerts] PATCH', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
