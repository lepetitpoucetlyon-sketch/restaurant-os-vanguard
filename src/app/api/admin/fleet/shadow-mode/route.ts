import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

const ShadowModeSchema = z.object({
  tenantId: z.string().min(1),
  mode: z.enum(['cloud_primary', 'local_survival', 'shadow_failover']),
  reason: z.string().min(1).optional()
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof ShadowModeSchema>;
  try {
    body = ShadowModeSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantId, mode, reason = 'Bascule manuelle PRA' } = body;

  try {
    // 1. Mettre à jour la configuration du réseau dans le tenantConfig
    const networkConfigPatch = {
      network: {
        activeMode: mode,
        lastFailoverAt: mode !== 'cloud_primary' ? new Date().toISOString() : null
      }
    };

    await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, networkConfigPatch, { merge: true });

    // 2. Audit Trail
    empireAudit.log({
      module: 'fleet',
      action: 'SHADOW_MODE_ACTIVATED',
      severity: 'critical',
      details: { tenantId, mode, reason },
      timestamp: new Date(),
    });

    logger.info(`[ShadowMode] Tenant ${tenantId} basculé en mode ${mode} par ${caller.uid}`);

    return NextResponse.json({ success: true, tenantId, mode });
  } catch (error) {
    logger.error(`[ShadowMode] Erreur de bascule pour ${tenantId}:`, error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
