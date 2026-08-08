/**
 * Digital Contract Vault — mcc-crm-2
 *
 * POST /api/admin/fleet/contracts           — enregistre CGV signée (hash SHA-256)
 * GET  /api/admin/fleet/contracts?tenantId  — liste les contrats du tenant
 * GET  /api/admin/fleet/contracts/status?tenantId — vérifie si CGV active signée (gate)
 *
 * Structure Nexus : mcc/contracts/{tenantId}/versions/{contractId}
 * Champs : version, signedAt, signedBy (userId), ipAddress, userAgent,
 *          contentHash (SHA-256 du texte CGV), status: 'signed' | 'revoked'
 *
 * Protégé : fleet_admin pour POST, mcc_support pour GET.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

const CURRENT_CGV_VERSION = process.env.CGV_VERSION ?? '2025-01';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: { tenantId: string; userId: string; cgvText: string; version?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tenantId, userId, cgvText, version = CURRENT_CGV_VERSION } = body;
  if (!tenantId || !userId || !cgvText) {
    return NextResponse.json({ error: 'tenantId, userId, cgvText requis' }, { status: 400 });
  }

  const contractId  = crypto.randomUUID();
  const contentHash = await sha256(cgvText);
  const signedAt    = new Date().toISOString();
  const ipAddress   = req.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent   = req.headers.get('user-agent') ?? 'unknown';

  const contract = {
    contractId,
    version,
    signedAt,
    signedBy:    userId,
    ipAddress,
    userAgent,
    contentHash,
    status:      'signed' as const,
  };

  await Nexus.adapter.set(`mcc/contracts/${tenantId}/versions/${contractId}`, contract);

  // Gate : marquer le tenant comme "CGV signée"
  await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
    cgv: { signed: true, version, signedAt, contractId },
  }, { merge: true });

  empireAudit.log({
    module: 'fleet',
    action: 'CONTRACT_SIGNED',
    severity: 'high',
    details: { tenantId, contractId, version, contentHash },
    timestamp: new Date(),
  });

  logger.info(`[Contracts] CGV v${version} signée par ${userId} pour ${tenantId} — hash ${contentHash.slice(0, 12)}…`);
  return NextResponse.json({ success: true, contractId, contentHash, signedAt });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const { searchParams } = req.nextUrl;
  const tenantId = searchParams.get('tenantId');
  const mode     = searchParams.get('mode'); // 'status' | undefined

  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  if (mode === 'status') {
    const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as
      { cgv?: { signed: boolean; version: string; signedAt: string; contractId: string } } | null;
    const cgv = config?.cgv;
    return NextResponse.json({
      signed:         cgv?.signed === true,
      version:        cgv?.version ?? null,
      signedAt:       cgv?.signedAt ?? null,
      contractId:     cgv?.contractId ?? null,
      blocked:        cgv?.signed !== true,
    });
  }

  const contracts = await Nexus.adapter.query(`mcc/contracts/${tenantId}/versions`);
  return NextResponse.json({ contracts });
}
