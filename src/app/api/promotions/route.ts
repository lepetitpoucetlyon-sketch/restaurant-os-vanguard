import 'server-only';
import { NextResponse } from 'next/server';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';

export async function POST(req: Request) {
  try {
    const caller = await requireTenantRole(req, 'manager');
    if (isDenied(caller)) return caller;

    const tenantId = caller.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non spécifié dans le jeton d\'authentification' }, { status: 403 });
    }

    const body = await req.json();
    const { promoId, name, discountPercent, applicableProductIds, expiresAt } = body;

    if (!promoId || !discountPercent) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (promoId, discountPercent)' }, { status: 400 });
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

    logger.info(`[PromotionsAPI] Promotion ${promoId} activée pour le tenant ${tenantId}`);

    return NextResponse.json({ success: true, promotion: promoData });
  } catch (err) {
    logger.error('[PromotionsAPI] Erreur création promotion', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
