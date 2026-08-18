/**
 * QR Code Device Activation — mcc-deploy-adv-2
 *
 * POST /api/admin/fleet/device-activation/generate
 *   Body: { tenantId: string; deviceType: 'ipad_pos' | 'kds' | 'tablet' }
 *   Génère un QR code (URL avec token signé, TTL 30min)
 *   Stocke: mcc/deviceTokens/{tokenId} = { tenantId, deviceType, expiresAt, used: false }
 *   Retourne: { qrUrl: string; tokenId: string; expiresAt: string }
 *
 * GET /api/admin/fleet/device-activation/activate?token=xxx
 *   Valide le token, marque used:true, retourne le tenantConfig bootstrap
 *   Retourne: { valid: boolean; tenantId?; deviceConfig? }
 *
 * DELETE /api/admin/fleet/device-activation?tokenId=xxx — révoque un token
 *
 * Protégé : super_admin pour generate/delete, token auto-signé pour activate.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

type DeviceType = 'ipad_pos' | 'kds' | 'tablet';

const TTL_MS = 30 * 60_000; // 30 minutes

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: { tenantId: string; deviceType: DeviceType };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tenantId, deviceType } = body;
  if (!tenantId || !deviceType) {
    return NextResponse.json({ error: 'tenantId et deviceType requis' }, { status: 400 });
  }

  const validTypes: DeviceType[] = ['ipad_pos', 'kds', 'tablet'];
  if (!validTypes.includes(deviceType)) {
    return NextResponse.json({ error: `deviceType invalide: ${validTypes.join(', ')}` }, { status: 400 });
  }

  const tokenId   = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  await Nexus.adapter.set(`mcc/deviceTokens/${tokenId}`, {
    tokenId, tenantId, deviceType, expiresAt, used: false, createdAt: new Date().toISOString(),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.restaurantos.app';
  const qrUrl  = `${appUrl}/device/activate?token=${tokenId}`;

  empireAudit.log({
    module: 'fleet',
    action: 'DEVICE_TOKEN_GENERATED',
    severity: 'medium',
    details: { tenantId, deviceType, tokenId },
    timestamp: new Date(),
  });

  logger.info(`[Device] Token QR généré: ${tokenId} pour ${tenantId}/${deviceType}`);
  return NextResponse.json({ success: true, qrUrl, tokenId, expiresAt });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    // Liste les tokens actifs (super_admin requis)
    const caller = await requireMccLevel(req, 'mcc_super_admin');
    if (isDenied(caller)) return caller as NextResponse;
    const tokens = await Nexus.adapter.query('mcc/deviceTokens');
    return NextResponse.json({ tokens });
  }

  // Activation publique (token auto-signé — pas de guard MCC)
  const record = await Nexus.adapter.get(`mcc/deviceTokens/${token}`) as {
    tokenId: string; tenantId: string; deviceType: string;
    expiresAt: string; used: boolean;
  } | null;

  if (!record) return NextResponse.json({ valid: false, error: 'Token inconnu' }, { status: 404 });
  if (record.used) return NextResponse.json({ valid: false, error: 'Token déjà utilisé' }, { status: 410 });
  if (new Date(record.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Token expiré' }, { status: 410 });
  }

  // Marquer utilisé
  await Nexus.adapter.set(`mcc/deviceTokens/${token}`, { ...record, used: true, activatedAt: new Date().toISOString() });

  // Charger le config tenant pour bootstrap
  const config = await Nexus.adapter.get(`tenants/${record.tenantId}/tenantConfig`);

  logger.info(`[Device] Activation ${record.deviceType} pour tenant ${record.tenantId}`);
  return NextResponse.json({
    valid:        true,
    tenantId:     record.tenantId,
    deviceType:   record.deviceType,
    deviceConfig: config,
  });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const tokenId = req.nextUrl.searchParams.get('tokenId');
  if (!tokenId) return NextResponse.json({ error: 'tokenId requis' }, { status: 400 });

  await Nexus.adapter.set(`mcc/deviceTokens/${tokenId}`, { used: true, revokedAt: new Date().toISOString() }, { merge: true });
  logger.info(`[Device] Token ${tokenId} révoqué`);
  return NextResponse.json({ success: true });
}
