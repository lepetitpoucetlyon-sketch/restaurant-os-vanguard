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
import { z } from 'zod';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const ChannelSchema = z.enum(['email', 'sms', 'whatsapp']);
type Channel = z.infer<typeof ChannelSchema>;

const ConsentPostSchema = z.object({
  customerId: z.string().min(1).max(120),
  channel: ChannelSchema,
  granted: z.boolean(),
  source: z.string().max(80).optional(),
});

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

  const parsed = ConsentPostSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalide', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { customerId, channel, granted, source = 'backoffice' } = parsed.data;

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
  const channelRaw = req.nextUrl.searchParams.get('channel');
  if (!customerId) return NextResponse.json({ error: 'customerId requis' }, { status: 400 });
  const channelParse = ChannelSchema.safeParse(channelRaw);
  if (!channelParse.success) {
    return NextResponse.json({ error: `Canal invalide: email, sms, whatsapp` }, { status: 400 });
  }
  const channel: Channel = channelParse.data;

  await Nexus.adapter.set(`tenants/${tenantId}/customerConsents/${customerId}`, {
    [channel]: { granted: false, revokedAt: new Date().toISOString(), source: 'revocation' },
  }, { merge: true });

  logger.info(`[Consent] Révocation ${channel} pour client ${customerId} (${tenantId})`);
  return NextResponse.json({ success: true, customerId, channel, revoked: true });
}
