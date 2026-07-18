import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { WebPushService } from '@/lib/push/webPushService';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SubscribeBodySchema = z.object({
  userId: z.string().min(1).optional(),
  subscription: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// POST /api/push/subscribe
// Persists a Web Push subscription for a user.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  const { userId, subscription } = parsed.data;

  // Resolve userId: prefer explicit param, fall back to a stable fingerprint
  // derived from the subscription endpoint so anonymous users are also tracked.
  const resolvedUserId =
    userId ??
    (typeof subscription.endpoint === 'string'
      ? Buffer.from(subscription.endpoint).toString('base64').slice(0, 40)
      : null);

  if (!resolvedUserId) {
    return NextResponse.json(
      { error: 'Unable to determine userId from request' },
      { status: 400 }
    );
  }

  try {
    // Cast to PushSubscription — the Nexus layer only stores the serialised form.
    await WebPushService.saveSubscription(
      resolvedUserId,
      subscription as unknown as PushSubscription
    );
    logger.info(`[/api/push/subscribe] Subscription saved for ${resolvedUserId}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    logger.error('[/api/push/subscribe] Failed to save subscription', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
