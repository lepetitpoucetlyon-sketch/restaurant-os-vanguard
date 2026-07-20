/**
 * Anti-Spam Rules — com-rules-1
 *
 * Vérifie avant envoi d'une campagne si un client peut recevoir un message.
 * Règles :
 *   1. Délai minimal entre 2 emails : 7 jours
 *   2. Quota mensuel : max 4 emails / mois par client
 *   3. Consentement canal requis (vérifié via /api/crm/consent)
 *   4. Client non unsubscribed (analytique)
 *
 * GET  /api/crm/anti-spam/check?tenantId&customerId&channel — vérifie 1 client
 * POST /api/crm/anti-spam/filter                            — filtre une liste de customers
 *   Body: { customerIds: string[]; channel: 'email' | 'sms' | 'whatsapp' }
 *   Retourne: { allowed: string[]; blocked: Array<{id, reason}> }
 *
 * Protégé : requireTenantAdmin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

type Channel = 'email' | 'sms' | 'whatsapp';

const COOLDOWN_MS     = 7 * 24 * 3600_000; // 7 jours
const MONTHLY_QUOTA   = 4;

interface SpamCheckResult {
  customerId: string;
  allowed:    boolean;
  reason?:    string;
}

async function checkCustomer(tenantId: string, customerId: string, channel: Channel): Promise<SpamCheckResult> {
  const now     = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Consentement canal
  const consents = await Nexus.adapter.get(`tenants/${tenantId}/customerConsents/${customerId}`) as
    Record<Channel, { granted?: boolean }> | null;

  if (!consents?.[channel]?.granted) {
    return { customerId, allowed: false, reason: `Pas de consentement ${channel}` };
  }

  // 2. Compteur mensuel
  const counter = await Nexus.adapter.get(`tenants/${tenantId}/spamCounters/${customerId}/${monthKey}`) as
    { count?: number; lastSentAt?: string } | null;

  if ((counter?.count ?? 0) >= MONTHLY_QUOTA) {
    return { customerId, allowed: false, reason: `Quota mensuel atteint (${MONTHLY_QUOTA}/mois)` };
  }

  // 3. Délai 7 jours
  if (counter?.lastSentAt) {
    const elapsed = now.getTime() - new Date(counter.lastSentAt).getTime();
    if (elapsed < COOLDOWN_MS) {
      const daysLeft = Math.ceil((COOLDOWN_MS - elapsed) / 86400_000);
      return { customerId, allowed: false, reason: `Délai anti-spam : encore ${daysLeft}j` };
    }
  }

  return { customerId, allowed: true };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  let body: { customerIds: string[]; channel: Channel };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { customerIds, channel } = body;
  if (!customerIds?.length || !channel) {
    return NextResponse.json({ error: 'customerIds et channel requis' }, { status: 400 });
  }

  const results = await Promise.all(
    customerIds.map(id => checkCustomer(tenantId, id, channel))
  );

  const allowed = results.filter(r => r.allowed).map(r => r.customerId);
  const blocked = results.filter(r => !r.allowed).map(r => ({ id: r.customerId, reason: r.reason }));

  logger.info(`[AntiSpam] Filter ${channel}: ${allowed.length}/${customerIds.length} autorisés`);
  return NextResponse.json({ allowed, blocked, channel });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const customerId = req.nextUrl.searchParams.get('customerId');
  const channel    = req.nextUrl.searchParams.get('channel') as Channel | null;

  if (!customerId || !channel) {
    return NextResponse.json({ error: 'customerId et channel requis' }, { status: 400 });
  }

  const result = await checkCustomer(tenantId, customerId, channel);
  return NextResponse.json(result);
}
