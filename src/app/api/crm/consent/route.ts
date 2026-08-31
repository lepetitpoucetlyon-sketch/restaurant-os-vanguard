/**
 * RGPD Opt-in par canal — com-consent-1
 *
 * Gère le consentement marketing par canal (email / SMS / WhatsApp) par client.
 * Chaque canal a un consentement indépendant (RGPD Art. 7).
 *
 * GET  /api/crm/consent?customerId  — lit les consentements d'un client
 * POST /api/crm/consent             — enregistre/met à jour un consentement
 * DELETE /api/crm/consent?customerId&channel — révoque un consentement
 *
 * Structure Nexus :
 *   tenants/{tenantId}/customerConsents/{customerId}
 *   Champs : { email: ConsentRecord; sms: ConsentRecord; whatsapp: ConsentRecord }
 *   ConsentRecord : { granted: boolean; grantedAt?: string; revokedAt?: string; source: string }
 *
 * Protégé : requireTenantUser (client self-service) ou requireTenantAdmin.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

type Channel = 'email' | 'sms' | 'whatsapp';

const VALID_CHANNELS: Channel[] = ['email', 'sms', 'whatsapp'];

interface ConsentRecord {
  granted:    boolean;
  grantedAt?: string;
  revokedAt?: string;
  source:     string;
}

type ConsentMap = Partial<Record<Channel, ConsentRecord>>;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const customerId = req.nextUrl.searchParams.get('customerId');
  if (!customerId) return NextResponse.json({ error: 'customerId requis' }, { status: 400 });

  const consents = await Nexus.adapter.get(`tenants/${tenantId}/customerConsents/${customerId}`) as ConsentMap | null;
  return NextResponse.json({ customerId, consents: consents ?? {} });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  let body: { customerId: string; channel: Channel; granted: boolean; source?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { customerId, channel, granted, source = 'backoffice' } = body;
  if (!customerId || !channel) {
    return NextResponse.json({ error: 'customerId et channel requis' }, { status: 400 });
  }

  if (!VALID_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: `Canal invalide: ${VALID_CHANNELS.join(', ')}` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const record: ConsentRecord = granted
    ? { granted: true,  grantedAt: now, source }
    : { granted: false, revokedAt: now, source };

  await Nexus.adapter.set(`tenants/${tenantId}/customerConsents/${customerId}`, {
    [channel]: record,
    updatedAt: now,
  }, { merge: true });

  logger.info(`[Consent] ${channel} → ${granted ? 'OPT-IN' : 'OPT-OUT'} pour client ${customerId} (${tenantId})`);
  return NextResponse.json({ success: true, customerId, channel, granted });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const customerId = req.nextUrl.searchParams.get('customerId');
  const channel    = req.nextUrl.searchParams.get('channel') as Channel | null;

  if (!customerId || !channel) {
    return NextResponse.json({ error: 'customerId et channel requis' }, { status: 400 });
  }

  if (!VALID_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: `Canal invalide: ${VALID_CHANNELS.join(', ')}` }, { status: 400 });
  }

  await Nexus.adapter.set(`tenants/${tenantId}/customerConsents/${customerId}`, {
    [channel]: { granted: false, revokedAt: new Date().toISOString(), source: 'revocation' },
  }, { merge: true });

  logger.info(`[Consent] Révocation ${channel} pour client ${customerId} (${tenantId})`);
  return NextResponse.json({ success: true, customerId, channel, revoked: true });
}
