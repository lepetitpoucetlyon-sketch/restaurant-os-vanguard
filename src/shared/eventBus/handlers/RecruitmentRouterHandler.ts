import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class RecruitmentRouterHandler {
  static register() { 
    return NexusEventBus.on('hr.application_received', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, applicationId, role, applicantName } = payload;
      logger.info(`[RecruitmentRouterHandler] Nouvelle candidature reçue pour le poste de ${role}`);

      try {
        await Nexus.adapter.update(`tenants/${tenantId}/hr/recruitment/applications/${applicationId}`, {
            role,
            applicantName,
            status: 'new',
            receivedAt: Date.now(),
            updatedAt: Date.now()
        });

        empireAudit.log({
            action: 'hr.application_received',
            module: 'human',
            userId: 'system',
            instanceId: tenantId,
            details: {
            applicationId: applicationId,
            role: role,
            applicantName: applicantName
            },
            severity: 'low',
            timestamp: new Date(),
        });

        NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId: tenantId,
            id: `alert-recruitment-${applicationId}`,
            type: 'info',
            title: 'Nouvelle Candidature',
            message: `${applicantName} a postulé pour le poste : ${role}.`,
            priority: 'low',
            read: false,
            timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error('[RecruitmentRouterHandler] Error saving application', String(err));
      }
    }, { id: 'recruitment-router', priority: 'BACKGROUND' });
  }
}
