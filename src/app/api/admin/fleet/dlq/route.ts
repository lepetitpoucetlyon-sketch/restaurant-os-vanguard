import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * GET /api/admin/fleet/dlq
 * Liste les entrées outbox en erreur ou done_no_consumer pour un tenant.
 * Accès : fleet_admin.
 */

const QuerySchema = z.object({
  tenantId: z.string().min(1),
  status: z.enum(['error', 'done_no_consumer', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

interface OutboxEntry {
  id: string;
  type?: string;
  eventName?: string;
  payload?: Record<string, unknown>;
  status: string;
  timestamp?: string;
  createdAt?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const caller = await requireMccLevel(request, 'fleet_admin');
    if (isDenied(caller)) return caller as NextResponse;

    const url = new URL(request.url);
    const query = QuerySchema.safeParse({
      tenantId: url.searchParams.get('tenantId') ?? '',
      status: url.searchParams.get('status') ?? 'all',
      limit: url.searchParams.get('limit') ?? '50',
    });
    if (!query.success) {
      return NextResponse.json({ error: query.error.issues[0]?.message ?? 'Paramètres invalides' }, { status: 400 });
    }

    const { tenantId, status, limit } = query.data;
    const path = `tenants/${tenantId}/mcc_outbox`;

    const whereFilters = status === 'all'
      ? [
          { field: 'status', operator: 'in' as const, value: ['error', 'done_no_consumer'] },
        ]
      : [{ field: 'status', operator: '==' as const, value: status }];

    const entries = await Nexus.adapter.query<OutboxEntry>(path, {
      where: whereFilters,
      limit,
    });

    return NextResponse.json({
      tenantId,
      count: entries.length,
      entries: entries.map((e) => ({
        id: e.id,
        eventName: e.type ?? e.eventName,
        status: e.status,
        timestamp: e.timestamp ?? e.createdAt,
        error: e.error,
        payloadPreview: e.payload ? JSON.stringify(e.payload).slice(0, 200) : undefined,
      })),
    });
  } catch (err) {
    logger.error('[DLQ] GET', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
