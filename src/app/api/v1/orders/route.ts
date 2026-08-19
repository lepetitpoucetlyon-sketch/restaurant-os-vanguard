import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { KDSCourseSequencingEngine } from '@/modules/ops/production/kds/services/KDSCourseSequencingEngine';
import type { CartItem } from '@/modules/ops/domain/schemas/pos';
import { toMicrounits } from '@/shared/schemas/primitives';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    const { tableId, channel = 'MOBILE_SERVER', items } = body;
    const tenantId = caller.tenantId;
    const operatorId = caller.uid;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Champ obligatoire manquant: items (tableau non vide)' },
        { status: 400 }
      );
    }

    const orderId = `ord_api_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const cartItems: CartItem[] = items.map((it, idx) => ({
      cartId: `cart_${orderId}_${idx}`,
      productId: it.productId,
      categoryId: it.categoryId ?? 'cat-default',
      name: it.name || `Article ${it.productId}`,
      quantity: Number(it.quantity) || 1,
      unitPriceInMicrounits: toMicrounits(Number(it.unitPriceInMicrounits) || 0),
      taxRate: (it.taxRate ?? '0.10') as '0.055' | '0.10' | '0.20',
      discountInMicrounits: toMicrounits(0),
      modifiers: [],
      course: it.course || 'plat',
      notes: it.notes,
    }));

    const totalInMicrounits = cartItems.reduce(
      (sum, it) => sum + it.unitPriceInMicrounits * it.quantity,
      0
    );

    const orderRecord = {
      id: orderId,
      tenantId,
      tableId: tableId || null,
      channel,
      operatorId,
      status: 'pending',
      items: cartItems,
      totalInCents: Math.round(totalInMicrounits / 10000),
      totalInMicrounits,
      timestamp: now,
      createdAt: now,
    };

    // 1. Persistance
    await Nexus.adapter.set(`tenants/${tenantId}/orders/${orderId}`, orderRecord);

    // 2. Initialisation cadençage KDS
    await KDSCourseSequencingEngine.initializeOrderCourses(tenantId, orderId, tableId, cartItems);

    // 3. Émission sur le bus
    await NexusEventBus.emit('order.placed', {
      v: 1,
      orderId,
      tableId: tableId || null,
      tenantId,
      operatorId,
      items: cartItems,
    });

    return NextResponse.json(
      {
        orderId,
        status: 'pending',
        totalInMicrounits,
        itemsCount: cartItems.length,
        createdAt: now,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Erreur traitement commande API' }, { status: 500 });
  }
}
