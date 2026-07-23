import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { WebPushService } from '@/lib/push/webPushService';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SendBodySchema = z
  .object({
    tenantId: z.string().min(1),
    userId: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(500),
    url: z.string().url().optional(),
  })
  .refine(data => data.userId !== undefined || data.role !== undefined, {
    message: 'Either userId or role must be provided',
  });

// ---------------------------------------------------------------------------
// Auth guard — require X-Push-Secret header
// ---------------------------------------------------------------------------

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.PUSH_SECRET;
  if (!secret) {
    // If the env var is not set, block all requests to avoid open relay
    logger.warn('[/api/push/send] PUSH_SECRET is not configured — denying request');
    return false;
  }
  const header = req.headers.get('x-push-secret');
  return header === secret;
}

// ---------------------------------------------------------------------------
// POST /api/push/send
// Sends a push notification to a specific user or all users with a given role.
// Requires X-Push-Secret header matching the PUSH_SECRET environment variable.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SendBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tenantId, userId, role, title, body: notifBody, url } = parsed.data;
  const payload = { title, body: notifBody, url };

  try {
    if (userId) {
      await WebPushService.sendToUser(tenantId, userId, payload);
      logger.info(`[/api/push/send] Notification sent to user ${userId} (tenant: ${tenantId})`);
    } else if (role) {
      await WebPushService.sendToRole(tenantId, role, payload);
      logger.info(`[/api/push/send] Notification sent to role "${role}" (tenant: ${tenantId})`);
    }

    return NextResponse.json({ sent: true }, { status: 200 });
  } catch (err) {
    logger.error('[/api/push/send] Failed to send notification', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
