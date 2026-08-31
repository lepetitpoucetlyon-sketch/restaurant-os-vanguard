import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';

const PromotionSchema = z.object({
  promoId: z.string().min(1).max(120),
  name: z.string().max(200).optional(),
  discountPercent: z.number().min(0.01).max(100),
  applicableProductIds: z.array(z.string().max(120)).max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  try {
    const caller = await requireTenantRole(req, 'manager');
    if (isDenied(caller)) return caller;

    const tenantId = caller.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non spécifié dans le jeton d\'authentification' }, { status: 403 });
    }

    const parsed = PromotionSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload invalide', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { promoId, name, discountPercent, applicableProductIds, expiresAt } = parsed.data;

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
      discountBps: Math.round(discountPercent * 100),
      productIds: applicableProductIds ?? [],
    });

    logger.info(`[PromotionsAPI] Promotion ${promoId} activée pour le tenant ${tenantId}`);

    return NextResponse.json({ success: true, promotion: promoData });
  } catch (err) {
    logger.error('[PromotionsAPI] Erreur création promotion', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
