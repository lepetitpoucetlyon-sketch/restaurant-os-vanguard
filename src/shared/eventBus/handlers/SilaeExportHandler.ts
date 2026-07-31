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
        // Vrai mock de l'appel HTTP (Déstubbing)
        // Dans un environnement de test, on pourrait fetch('https://sandbox.api.silae.fr/v1/payroll/export')
        // [TEMPORARY MOCK] Simulation d'appel à l'API Silae pour l'export paie.
        // A remplacer par l'URL réelle de l'API Silae (ex: https://api.silae.fr/v1/export) en production.
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            body: JSON.stringify({
                tenantId,
                periodId,
                totalEmployees
            }),
            headers: { 'Content-Type': 'application/json' }
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
