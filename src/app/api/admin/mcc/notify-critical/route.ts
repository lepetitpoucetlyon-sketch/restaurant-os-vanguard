import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMccRoute } from '@/lib/server/routeWrapper';
import type { MccRole } from '@/lib/server/adminAuthGuard';
import { WebPushService } from '@/lib/push/webPushService';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

const BodySchema = z.object({
  insights: z.array(z.object({
    id:     z.string(),
    title:  z.string(),
    impact: z.string(),
  })),
  tenantId: z.string().optional(),
});

export const POST = withMccRoute(
  async (req, { caller }) => {
    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { insights, tenantId = '__FLEET__' } = parsed.data;
    const critical = insights.filter(i => i.impact === 'CRITICAL');

    if (critical.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sent = 0;
    for (const insight of critical) {
      try {
        // Notif au gérant du restaurant concerné (top-level tenant role = admin).
        await WebPushService.sendToRole(tenantId, 'admin', {
          title: `⚠️ Alerte Fleet : ${insight.title}`,
          body:  `Impact CRITIQUE détecté par MacroBrain. Action requise.`,
          url:   '/admin/mcc?tab=intelligence',
        });
        sent++;
      } catch (err) {
        logger.warn(`[notify-critical] Push failed for insight ${insight.id}`, toError(err).message);
      }
    }

    logger.info(`[notify-critical] ${sent}/${critical.length} notification(s) envoyées par ${caller.uid}`);
    return NextResponse.json({ sent });
  },
  { minLevel: 'mcc_super_admin' },
);

