import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { WebPushService } from '@/lib/push/webPushService';
import { logger } from '@/lib/logger';

const BodySchema = z.object({
  insights: z.array(z.object({
    id:     z.string(),
    title:  z.string(),
    impact: z.string(),
  })),
  tenantId: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

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
      await WebPushService.sendToRole(tenantId, 'fleet_admin', {
        title: `⚠️ Alerte Fleet : ${insight.title}`,
        body:  `Impact CRITIQUE détecté par MacroBrain. Action requise.`,
        url:   '/admin/mcc?tab=intelligence',
      });
      sent++;
    } catch (err) {
      logger.warn(`[notify-critical] Push failed for insight ${insight.id}`, String(err));
    }
  }

  logger.info(`[notify-critical] ${sent}/${critical.length} notification(s) envoyées par ${caller.uid}`);
  return NextResponse.json({ sent });
}
