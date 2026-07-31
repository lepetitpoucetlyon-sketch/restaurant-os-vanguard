import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export class SilaeExportHandler {
  static register() { 
    return NexusEventBus.on('hr.preroll_validated', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, periodId, validatedBy, totalEmployees } = payload;
      logger.info(`[SilaeExportHandler] Exporting payroll for period ${periodId} (Tenant: ${tenantId})`);

      try {
        const silaeUrl = process.env.SILAE_API_URL || 'https://api.silae.fr/v1';
        const silaeKey = process.env.SILAE_API_KEY;

        if (!silaeKey) {
            logger.warn(`[SilaeExportHandler] Clé SILAE manquante. Mode dégradé: mise en file d'attente (pendingExports)`);
            await Nexus.adapter.update(`tenants/${tenantId}/hr/pendingExports/${periodId}`, {
                periodId,
                status: 'queued',
                totalEmployees,
                queuedAt: Date.now()
            });
            return;
        }

        const response = await fetch(`${silaeUrl}/export`, {
            method: 'POST',
            body: JSON.stringify({
                tenantId,
                periodId,
                totalEmployees
            }),
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${silaeKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Silae API responded with status ${response.status}`);
        }

        const data = await response.json();
        const exportId = data.id || `silae-exp-${Date.now()}`;

        // Enregistrement du résultat en BDD
        await Nexus.adapter.update(`tenants/${tenantId}/hr/payroll_exports/${exportId}`, {
            periodId,
            exportId,
            status: 'completed',
            exportedAt: Date.now()
        });

        empireAudit.log({
          action: 'hr.silae_export_success',
          module: 'human',
          userId: validatedBy || 'system',
          instanceId: tenantId,
          details: {
            periodId: periodId,
            validatedBy: validatedBy,
            totalEmployees: totalEmployees,
            exportId: exportId
          },
          severity: 'high',
          timestamp: new Date(),
        });

      } catch (error) {
        logger.error(`[SilaeExportHandler] Erreur lors de l'export:`, String(error));
        
        // Mode dégradé en cas d'erreur API
        await Nexus.adapter.update(`tenants/${tenantId}/hr/pendingExports/${periodId}`, {
            periodId,
            status: 'error_queued',
            error: String(error),
            totalEmployees,
            queuedAt: Date.now()
        });

        empireAudit.log({
          action: 'hr.silae_export_failed',
          module: 'human',
          userId: validatedBy || 'system',
          instanceId: tenantId,
          details: {
            periodId: periodId,
            error: String(error)
          },
          severity: 'critical',
          timestamp: new Date(),
        });
      }
    }, { id: 'silae-export', priority: 'HIGH' });
  }
}
