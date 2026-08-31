/**
 * POST /api/admin/fleet/billing/feature-flags
 * Active/désactive un module payant pour un tenant.
 *
 * Body : { tenantId: string, module: 'marketing' | 'rh' | 'ia', enabled: boolean }
 *
 * Modules payants :
 *   marketing → +99€/mois (CRM campagnes, A/B tests, analytics)
 *   rh        → +49€/mois (planning, DPAE, timeclock avancé)
 *   ia        → +149€/mois (RAG Oracle, prédictions, MacroBrain)
 *
 * Protégé : super_admin.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export const PAID_MODULES = {
  marketing: { label: 'Module Marketing CRM', priceEur: 99 },
  rh:        { label: 'Module RH & Planification', priceEur: 49 },
  ia:        { label: 'Module Intelligence IA', priceEur: 149 },
} as const;

export type PaidModule = keyof typeof PAID_MODULES;

interface FeatureFlagRequest {
  tenantId: string;
  module:   PaidModule;
  enabled:  boolean;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: FeatureFlagRequest;
  try {
    body = await req.json() as FeatureFlagRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tenantId, module: mod, enabled } = body;

  if (!tenantId || !mod || !(mod in PAID_MODULES)) {
    return NextResponse.json({ error: 'tenantId et module valide requis' }, { status: 400 });
  }

  try {
    await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
      featureFlags: { [mod]: enabled },
    }, { merge: true });

    empireAudit.log({
      module: 'fleet',
      action: enabled ? 'MODULE_ENABLED' : 'MODULE_DISABLED',
      severity: 'medium',
      details: { tenantId, module: mod, enabled },
      timestamp: new Date(),
    });

    const modInfo = PAID_MODULES[mod];
    logger.info(`[FeatureFlags] ${tenantId} → ${mod} ${enabled ? 'ON' : 'OFF'} (${modInfo.priceEur}€/mois)`);

    return NextResponse.json({ success: true, tenantId, module: mod, enabled });
  } catch (err) {
    logger.error('[FeatureFlags] Erreur', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

/**
 * GET /api/admin/fleet/billing/feature-flags?tenantId=xxx
 * Retourne les flags actifs pour un tenant.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as {
    featureFlags?: Record<string, boolean>;
  } | null;

  const flags = config?.featureFlags ?? {};
  return NextResponse.json({
    tenantId,
    flags: Object.fromEntries(
      Object.keys(PAID_MODULES).map(k => [k, flags[k] ?? false]),
    ),
  });
}
