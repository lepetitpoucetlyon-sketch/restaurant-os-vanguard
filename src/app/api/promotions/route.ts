import { NextResponse } from 'next/server';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, promoId, name, discountPercent, applicableProductIds, expiresAt } = body;

    if (!tenantId || !promoId || !discountPercent) {
      return NextResponse.json({ error: 'Missing required parameters (tenantId, promoId, discountPercent)' }, { status: 400 });
    }

    const promoPath = `tenants/${tenantId}/promotions/${promoId}`;
    const promoData = {
      id: promoId,
      name: name ?? `Promotion ${discountPercent}%`,
      discountPercent,
      applicableProductIds: applicableProductIds ?? [],
      expiresAt: expiresAt ?? new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await Nexus.adapter.set(promoPath, promoData);

    // Émission EventBus (R4 - commerce.promotion_activated)
    await NexusEventBus.emitDurable('commerce.promotion_activated', {
      v: 1,
      tenantId,
      promotionId: promoId,
      discountBps: Math.round(discountPercent * 100), // e.g. 10% -> 1000 bps
      productIds: applicableProductIds ?? [],
    });

    logger.info(`[PromotionsAPI] Promotion ${promoId} activée et émise sur NexusEventBus`);

    return NextResponse.json({ success: true, promotion: promoData });
  } catch (err) {
    logger.error('[PromotionsAPI] Erreur création promotion', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
