import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { KDSCourseSequencingEngine } from '@/modules/ops';
import type { CartItem } from '@/modules/ops';
import { toMicrounits } from '@/shared/schemas/primitives';
import { withPublicRoute } from '@/lib/server/routeWrapper';
import { runWithServerTenant } from '@/lib/server/ServerTenantStorage';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const GUEST_CHANNELS = new Set(['QR_TABLE', 'CLICK_AND_COLLECT', 'KIOSK', 'MOBILE_GUEST']);

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  categoryId: z.string().optional(),
  name: z.string().optional(),
  quantity: z.number().int().min(1).max(99).default(1),
  unitPriceInMicrounits: z.number().min(0),
  taxRate: z.enum(['0.055', '0.10', '0.20']).optional(),
  course: z.enum(['entree', 'plat', 'dessert']).optional().default('plat'),
  notes: z.string().max(280).optional(),
});

const OrderBodySchema = z.object({
  tenantId: z.string().min(1).optional(),
  tableId: z.string().nullable().optional(),
  channel: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, 'items: tableau non vide obligatoire'),
});

/**
 * POST /api/v1/orders
 *
 * Deux modes :
 *  - **Personnel** (jeton d'auth valide) : `operatorId` = l'utilisateur, `channel` libre.
 *  - **Convive** (parcours QR, sans session) : rate-limité par IP, `tenantId` pris
 *    dans le corps, `operatorId` = `guest`, `channel` contraint à la liste convive.
 *
 * Dans les deux cas : écriture `ops_flows/`, init cadençage KDS, émission `order.placed`.
 */
export const POST = withPublicRoute(
  async (req: NextRequest, ctx): Promise<NextResponse> => {
    const caller = await requireTenantUser(req);

    let body: z.infer<typeof OrderBodySchema>;
    try {
      body = OrderBodySchema.parse(await req.json());
    } catch (err) {
      const details = err instanceof z.ZodError ? err.flatten() : undefined;
      return NextResponse.json({ error: 'Payload de commande invalide', details }, { status: 400 });
    }

    let tenantId: string;
    let operatorId: string;
    let channel: string;
    let role: string;

    if (!isDenied(caller)) {
      tenantId = caller.tenantId;
      operatorId = caller.uid;
      channel = body.channel || 'MOBILE_SERVER';
      role = caller.role;
    } else {
      // Mode convive : borne / QR code, sans session.
      tenantId = body.tenantId || req.nextUrl.searchParams.get('tenantId') || ctx.resolvedTenantId || '';
      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId obligatoire pour une commande convive' }, { status: 400 });
      }
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
      const rl = await getRateLimiter().check(`orders:${ip}:${tenantId}`, 12, 60 * 1000);
      if (!rl.allowed) {
        return NextResponse.json({ error: 'Trop de commandes envoyées, patientez un instant.' }, { status: 429 });
      }
      operatorId = 'guest';
      channel = GUEST_CHANNELS.has(body.channel ?? '') ? (body.channel as string) : 'QR_TABLE';
      role = 'guest';
    }

    return await runWithServerTenant({ tenantId, role, userId: operatorId, isMcc: false }, async () => {
      try {
        const { tableId, items } = body;
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
          course: it.course,
          notes: it.notes,
        }));

        const totalInMicrounits = cartItems.reduce(
          (sum, it) => sum + it.unitPriceInMicrounits * it.quantity,
          0,
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

        await Nexus.adapter.set(`tenants/${tenantId}/ops_flows/${orderId}`, orderRecord);
        await KDSCourseSequencingEngine.initializeOrderCourses(tenantId, orderId, tableId ?? undefined, cartItems);
        await NexusEventBus.emit('order.placed', {
          v: 1,
          orderId,
          tableId: tableId || null,
          tenantId,
          operatorId,
          items: cartItems,
        });

        logger.info(`[Orders] Commande créée ${orderId} (${channel})`, {
          tenantId,
          orderId,
          correlationId: ctx.correlationId,
        });

        return NextResponse.json(
          { orderId, status: 'pending', totalInMicrounits, itemsCount: cartItems.length, createdAt: now },
          { status: 201 },
        );
      } catch (err) {
        logger.error('[Orders] Erreur traitement commande API', {
          error: err,
          correlationId: ctx.correlationId,
        });
        return NextResponse.json({ error: 'Erreur traitement commande API' }, { status: 500 });
      }
    });
  },
);

