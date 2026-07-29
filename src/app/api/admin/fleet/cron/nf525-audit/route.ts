import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
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

    const results = [];
    let anomalies = 0;

    for (const tenantId of tenantIds) {
      // Simulation de la vérification de la chaîne cryptographique
      // Dans le monde réel, on vérifierait que le hash de la dernière transaction
      // correspond au sceau enregistré.
      
      const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as any;
      const isCompliant = config?.nf525Status !== 'violation';

      if (!isCompliant) {
        anomalies++;
        logger.warn(`[NF525-Cron] ⚠️ Violation détectée pour le tenant ${tenantId}`);
        // TODO: Déclencher une alerte critique à la DGFIP ou verrouiller le tenant (SovereignLockout)
      }

      results.push({
        tenantId,
        status: isCompliant ? 'COMPLIANT' : 'VIOLATION',
        auditedAt: new Date().toISOString()
      });
    }

    empireAudit.log({
      module: 'fleet',
      action: 'CRON_NF525_AUDIT',
      severity: anomalies > 0 ? 'critical' : 'info',
      details: { tenantsAudited: tenantIds.length, anomaliesCount: anomalies } as unknown as import('@/shared/nexus-contract').SovereignData,
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
