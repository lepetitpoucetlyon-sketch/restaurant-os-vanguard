import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Cette route doit idéalement être appelée par Cloud Scheduler avec un jeton d'authentification serveur.
  // Pour la démo, on la protège avec fleet_admin.
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  logger.info('[NF525-Cron] Démarrage de l\'audit périodique de la flotte...');

  try {
    const instances = await Nexus.adapter.query<{ id: string }>('mcc/empire/instances');
    const tenantIds = instances.map(i => i.id).filter(Boolean);

    const { fleetEngine } = await import('@/modules/intelligence/ia/fleet/FleetAdapter');
    const verification = await fleetEngine.verifyFleetCompliance(tenantIds);

    let anomalies = 0;
    const results = [];

    for (const result of verification.results) {
      const { tenantId, chainValid, lastSealAt } = result;

      if (!chainValid) {
        anomalies++;
        logger.error(`[NF525-Cron] ⚠️ VIOLATION DE LA CHAÎNE NF525 DÉTECTÉE pour le tenant ${tenantId}`);
        
        // Sovereign Lockout : Verrouiller le tenant
        await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
            nf525Status: 'violation',
            status: 'locked_nf525_breach',
            lockoutReason: 'NF525 Cryptographic Chain Breach',
            lockoutAt: new Date().toISOString()
        }, { merge: true });

        // Déclencher le kill-switch via EventBus
        const { NexusEventBus } = await import('@orchestration/NexusEventBus');
        await NexusEventBus.emitDurable('sovereign.breach', {
            v: 1,
            targetTenantId: tenantId,
            anchoredTenantId: 'mcc',
            message: 'Violations des sceaux cryptographiques NF525. Caisse verrouillée.'
        });
      }

      results.push({
        tenantId,
        status: chainValid ? 'COMPLIANT' : 'VIOLATION',
        auditedAt: new Date().toISOString(),
        lastSealAt
      });
    }

    empireAudit.log({
      module: 'fleet',
      action: 'CRON_NF525_AUDIT',
      severity: anomalies > 0 ? 'critical' : 'low',
      details: { tenantsAudited: tenantIds.length, anomaliesCount: anomalies },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Audit NF525 terminé',
      summary: {
        totalAudited: tenantIds.length,
        anomalies,
      },
      results
    });
  } catch (error) {
    logger.error('[NF525-Cron] Erreur lors de l\'audit:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
