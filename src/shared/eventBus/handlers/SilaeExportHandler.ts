import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';

export class SilaeExportHandler {
  static register() { return NexusEventBus.on('hr.preroll_validated', async (payload) => {
      console.log(`[SilaeExportHandler] Exporting payroll for period ${payload.periodId} (Tenant: ${payload.tenantId})`);

      // Mock de l'appel API Silae
      try {
        // const response = await fetch('https://api.silae.fr/v1/payroll/export', { ... })
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network

        empireAudit.log({
          action: 'hr.silae_export_success',
          module: 'human',
          userId: 'system',
          instanceId: payload.tenantId,
          details: {
            periodId: payload.periodId,
            validatedBy: payload.validatedBy,
            totalEmployees: payload.totalEmployees
          },
          severity: 'high',
        timestamp: new Date(),
});

      } catch (error) {
        console.error(`[SilaeExportHandler] Erreur lors de l'export:`, error);
        
        empireAudit.log({
          action: 'hr.silae_export_failed',
          module: 'human',
          userId: 'system',
          instanceId: payload.tenantId,
          details: {
            periodId: payload.periodId,
            error: String(error)
          },
          severity: 'critical',
        timestamp: new Date(),
});
      }
    });
  }
}
