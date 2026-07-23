import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { WebPushService } from '@/lib/push/webPushService';
import { logger } from '@/lib/logger';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';

// ---------------------------------------------------------------------------
// Validation — userId retiré : l'uid vient du JWT, jamais du client (IDOR fix)
// ---------------------------------------------------------------------------

const SubscribeBodySchema = z.object({
  subscription: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// POST /api/push/subscribe
// Persists a Web Push subscription for the authenticated user.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SubscribeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { subscription } = parsed.data;

  try {
    await WebPushService.saveSubscription(
      caller.uid,
      subscription as unknown as PushSubscription
    );
    logger.info(`[/api/push/subscribe] Subscription saved for ${caller.uid}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    logger.error('[/api/push/subscribe] Failed to save subscription', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
