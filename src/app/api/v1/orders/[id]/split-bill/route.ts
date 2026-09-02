import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { getCallerAuth } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/orders/[id]/split-bill
 *
 * Enregistre l'intention de partage d'addition émise depuis le smartphone du
 * convive (TableSplitBillModal). Endpoint public (parcours QR) : l'id de commande
 * fait office de jeton de capacité — même modèle que `/api/v1/orders/service-request`.
 *
 * Ce n'est PAS un encaissement : le règlement de chaque part se fait au POS (ou au
 * terminal apporté en salle). L'event `pos.split_bill_processed` prévient le
 * service que la table a préparé son partage.
 */
const SplitBillSchema = z.object({
  tenantId: z.string().min(1),
  tableNumber: z.string().max(16).optional(),
  splitType: z.enum(['equipartition', 'by_item']),
  partsCount: z.number().int().min(1).max(50),
  shareInMicrounits: z.number().int().min(0),
  tipInMicrounits: z.number().int().min(0).default(0),
  totalInMicrounits: z.number().int().min(0),
  method: z.enum(['card', 'apple_pay', 'counter']).default('counter'),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await context.params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const rl = await getRateLimiter().check(`split-bill:${ip}:${orderId}`, 20, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez dans un instant.' }, { status: 429 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = SplitBillSchema.safeParse({
    ...raw,
    tenantId: raw.tenantId || req.nextUrl.searchParams.get('tenantId'),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload de partage invalide', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { tenantId, tableNumber, splitType, partsCount, shareInMicrounits, tipInMicrounits, totalInMicrounits, method } = parsed.data;

  // Si un jeton est fourni, il doit correspondre au tenant ciblé (défense en profondeur).
  if (req.headers.get('authorization')) {
    const caller = await getCallerAuth(req);
    if (caller?.tenantId && caller.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Accès non autorisé pour ce tenant' }, { status: 403 });
    }
  }

  const now = Date.now();
  const splitId = `split_${now}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    await Nexus.adapter.set(`tenants/${tenantId}/billSplits/${orderId}`, {
      id: splitId,
      orderId,
      tableNumber: tableNumber ?? null,
      splitType,
      partsCount,
      shareInMicrounits,
      tipInMicrounits,
      totalInMicrounits,
      method,
      status: 'pending_settlement',
      requestedAt: new Date(now).toISOString(),
      createdAt: now,
    });

    await NexusEventBus.emitDurable('pos.split_bill_processed', {
      v: 1,
      tenantId,
      orderId,
      splitType,
      partsCount,
      totalInMicrounits,
      processedAt: now,
    });

    logger.info(`[SplitBill] Partage enregistré: ${orderId} (${splitType}, ${partsCount} parts) tenant ${tenantId}`);

    return NextResponse.json({ success: true, splitId, dueInMicrounits: shareInMicrounits + tipInMicrounits });
  } catch (err) {
    logger.error('[SplitBill] Échec enregistrement du partage', err);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du partage" }, { status: 500 });
  }
}
