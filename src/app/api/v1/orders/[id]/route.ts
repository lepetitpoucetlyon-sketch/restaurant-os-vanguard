import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Order } from '@nexus/contracts';

export const dynamic = 'force-dynamic';

/**
 * 🔍 GET /api/v1/orders/[id]
 * Récupère le statut détaillé et les articles d'une commande (tracking temps réel).
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  try {
    const { id } = await context.params;
    const tenantId = caller.tenantId;

    const order = (await Nexus.adapter.get(
      `tenants/${tenantId}/ops_flows/${id}`
    )) as Order | null;

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable', orderId: id },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      tenantId: order.tenantId,
      tableId: (order as unknown as Record<string, unknown>).tableId ?? null,
      status: order.status,
      channel: (order as unknown as Record<string, unknown>).channel ?? 'POS',
      items: order.items,
      totalInMicrounits: order.totalInMicrounits ?? (order.totalInCents ? order.totalInCents * 10000 : 0),
      createdAt: order.createdAt || order.timestamp,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    );
  }
}
