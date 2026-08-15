import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { KDSCourseSequencingEngine } from '@/modules/ops/production/kds/services/KDSCourseSequencingEngine';
import type { CartItem } from '@/modules/ops/workflow/engine/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, tableId, channel = 'MOBILE_SERVER', operatorId = 'api-client', items } = body;

    if (!tenantId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: tenantId, items (tableau non vide)' },
        { status: 400 }
      );
    }

    const orderId = `ord_api_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const cartItems: CartItem[] = items.map((it, idx) => ({
      cartId: `cart_${orderId}_${idx}`,
      productId: it.productId,
      name: it.name || `Article ${it.productId}`,
      quantity: Number(it.quantity) || 1,
      unitPriceInMicrounits: Number(it.unitPriceInMicrounits) || 0,
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
