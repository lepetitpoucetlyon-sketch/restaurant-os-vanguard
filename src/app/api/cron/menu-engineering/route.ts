import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * POST /api/cron/menu-engineering
 * Déclenche `intelligence.menu_engineering_requested` pour chaque tenant actif.
 * Prévu pour être appelé une fois par semaine (Vercel Cron ou GitHub Actions schedule).
 *
 * Auth : CRON_SECRET dans le header Authorization (même pattern que weekly-report)
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    logger.error('[cron/menu-engineering] CRON_SECRET non configuré');
    return NextResponse.json({ error: 'CRON_SECRET manquant' }, { status: 503 });
  }

  const providedBuf = Buffer.from(authHeader?.replace('Bearer ', '') ?? '');
  const expectedBuf = Buffer.from(expected);
  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const tenants = await Nexus.adapter.query<{ id: string; status?: string }>('mcc/tenants', {
    where: [{ field: 'status', operator: '==', value: 'active' }],
  });

  let triggered = 0;
  for (const tenant of tenants) {
    await NexusEventBus.emitDurable('intelligence.menu_engineering_requested', {
      tenantId: tenant.id,
      periodDays: 7,
    });
    triggered++;
  }

  logger.info(`[cron/menu-engineering] Menu engineering déclenché pour ${triggered} tenant(s)`);
  return NextResponse.json({ ok: true, triggered });
}
