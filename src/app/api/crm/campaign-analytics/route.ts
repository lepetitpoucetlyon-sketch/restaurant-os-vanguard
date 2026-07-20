/**
 * Analytics campagne — com-analytics-1
 *
 * GET /api/crm/campaign-analytics?campaignId  — stats d'une campagne
 * POST /api/crm/campaign-analytics             — enregistre un événement (open/click/conversion)
 *
 * Structure Nexus :
 *   tenants/{tenantId}/campaignAnalytics/{campaignId}/events/{eventId}
 *   tenants/{tenantId}/campaignAnalytics/{campaignId}/summary (agrégat mis à jour)
 *
 * Événements supportés : 'sent' | 'opened' | 'clicked' | 'converted' | 'unsubscribed'
 * Champs revenue sur 'converted' : amountInMicrounits (NF525-compatible)
 *
 * Protégé : requireTenantAdmin pour GET, requireTenantUser pour POST (pixel tracking).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

type EventType = 'sent' | 'opened' | 'clicked' | 'converted' | 'unsubscribed';

interface CampaignEvent {
  eventId:           string;
  campaignId:        string;
  customerId:        string;
  type:              EventType;
  occurredAt:        string;
  amountInMicrounits?: number;
  metadata?:         Record<string, string>;
}

interface CampaignSummary {
  campaignId: string;
  sent:        number;
  opened:      number;
  clicked:     number;
  converted:   number;
  unsubscribed: number;
  revenueInMicrounits: number;
  openRate:    number;
  clickRate:   number;
  conversionRate: number;
  updatedAt:   string;
}

async function updateSummary(tenantId: string, campaignId: string): Promise<void> {
  const events = await Nexus.adapter.query(
    `tenants/${tenantId}/campaignAnalytics/${campaignId}/events`
  ) as CampaignEvent[];

  const counts = { sent: 0, opened: 0, clicked: 0, converted: 0, unsubscribed: 0, revenueInMicrounits: 0 };
  for (const e of events) {
    if      (e.type === 'sent')         counts.sent++;
    else if (e.type === 'opened')       counts.opened++;
    else if (e.type === 'clicked')      counts.clicked++;
    else if (e.type === 'converted')    { counts.converted++; counts.revenueInMicrounits += e.amountInMicrounits ?? 0; }
    else if (e.type === 'unsubscribed') counts.unsubscribed++;
  }

  const summary: CampaignSummary = {
    campaignId,
    ...counts,
    openRate:       counts.sent > 0 ? Math.round((counts.opened / counts.sent) * 100) : 0,
    clickRate:      counts.opened > 0 ? Math.round((counts.clicked / counts.opened) * 100) : 0,
    conversionRate: counts.clicked > 0 ? Math.round((counts.converted / counts.clicked) * 100) : 0,
    updatedAt: new Date().toISOString(),
  };

  await Nexus.adapter.set(`tenants/${tenantId}/campaignAnalytics/${campaignId}/summary`, summary);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  let body: { campaignId: string; customerId: string; type: EventType; amountInMicrounits?: number; metadata?: Record<string, string> };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { campaignId, customerId, type, amountInMicrounits, metadata } = body;
  if (!campaignId || !customerId || !type) {
    return NextResponse.json({ error: 'campaignId, customerId, type requis' }, { status: 400 });
  }

  const eventId = crypto.randomUUID();
  const event: CampaignEvent = {
    eventId, campaignId, customerId, type,
    occurredAt: new Date().toISOString(),
    amountInMicrounits, metadata,
  };

  await Nexus.adapter.set(
    `tenants/${tenantId}/campaignAnalytics/${campaignId}/events/${eventId}`,
    event
  );

  await updateSummary(tenantId, campaignId).catch(() => null);

  logger.info(`[CampaignAnalytics] ${type} event — campagne ${campaignId} client ${customerId}`);
  return NextResponse.json({ success: true, eventId });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const campaignId = req.nextUrl.searchParams.get('campaignId');
  if (!campaignId) return NextResponse.json({ error: 'campaignId requis' }, { status: 400 });

  const summary = await Nexus.adapter.get(
    `tenants/${tenantId}/campaignAnalytics/${campaignId}/summary`
  );

  if (!summary) {
    return NextResponse.json({ campaignId, summary: null, message: 'Aucune donnée encore' });
  }

  return NextResponse.json({ campaignId, summary });
}
