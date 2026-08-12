import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/axiom';
import { toError } from "@/lib/toError";

/**
 * 🚀 API: Basculer le mode Rush (Pause Livraison)
 * Déclenche l'événement `store.rush_mode_toggled` qui sera capté
 * par le DeliveryRushModeHandler pour mettre en pause les agrégateurs.
 */
export async function POST(req: NextRequest) {
  // Seul un manager ou admin ayant la permission spécifique peut le faire
  const caller = await requireTenantRole(req, 'manager');
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    const { isPaused } = body; // true = PAUSE (Rush), false = ONLINE

    if (typeof isPaused !== 'boolean') {
        return NextResponse.json({ error: 'Payload invalide. "isPaused" boolean requis.' }, { status: 400 });
    }

    const tenantId = caller.tenantId;

    logger.info(`[Delivery API] Requête de mode Rush reçue: Pause=${isPaused} par ${caller.uid}`);

    // Émettre l'événement de manière durable
    await NexusEventBus.emitDurable('store.rush_mode_toggled', {
        v: 1,
        tenantId,
        isPaused,
        requestedBy: caller.uid
    });

    return NextResponse.json({ success: true, isPaused });
  } catch (error) {
    logger.error('[Delivery API] Erreur lors du basculement Rush Mode', { error: toError(error).message });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
