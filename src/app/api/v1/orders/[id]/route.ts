import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCallerAuth } from '@/lib/server/adminAuthGuard';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { withPublicRoute } from '@/lib/server/routeWrapper';
import { runWithServerTenant } from '@/lib/server/ServerTenantStorage';
import type { Order } from '@nexus/contracts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/orders/[id]?tenantId=…
 *
 * Statut d'une commande pour le suivi en direct (LiveOrderTracker).
 * Endpoint public : l'id de commande (`ord_api_<ts>_<random>`, non devinable)
 * fait office de jeton de capacité, comme `/api/v1/menu`. `tenantId` obligatoire
 * en query. Si un jeton d'auth est présent, il doit correspondre au tenant.
 * La charge utile est volontairement minimale (pas de lignes détaillées).
 */
export const GET = withPublicRoute<{ params: Promise<{ id: string }> }>(
  async (req: NextRequest, ctx, routeParams): Promise<NextResponse> => {
    if (!routeParams?.params) {
      return NextResponse.json({ error: 'Paramètres de route manquants' }, { status: 400 });
    }
    const { id } = await routeParams.params;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const tenantId = req.nextUrl.searchParams.get('tenantId') || ctx.resolvedTenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Paramètre tenantId manquant' }, { status: 400 });
    }

    const rl = await getRateLimiter().check(`order-status:${ip}:${id}`, 120, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes, veuillez réessayer plus tard' }, { status: 429 });
    }

    if (req.headers.get('authorization')) {
      const caller = await getCallerAuth(req);
      if (caller?.tenantId && caller.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Accès non autorisé pour ce tenant' }, { status: 403 });
      }
    }

    return await runWithServerTenant({ tenantId, role: 'guest', isMcc: false }, async () => {
      try {
        const order = (await Nexus.adapter.get(`tenants/${tenantId}/ops_flows/${id}`)) as Order | null;

        if (!order) {
          return NextResponse.json({ error: 'Commande introuvable', orderId: id }, { status: 404 });
        }

        const items = Array.isArray(order.items) ? order.items : [];
        return NextResponse.json({
          orderId: order.id,
          tenantId: order.tenantId,
          tableId: (order as unknown as Record<string, unknown>).tableId ?? null,
          status: order.status,
          channel: (order as unknown as Record<string, unknown>).channel ?? 'POS',
          itemsCount: items.reduce((sum, it) => sum + (Number((it as { quantity?: number }).quantity) || 1), 0),
          totalInMicrounits:
            order.totalInMicrounits ?? (order.totalInCents ? order.totalInCents * 10_000 : 0),
          createdAt: order.createdAt || order.timestamp,
        });
      } catch (err) {
        return NextResponse.json(
          { error: 'Erreur lors de la récupération de la commande' },
          { status: 500 },
        );
      }
    });
  },
);

