import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';

export class RecruitmentRouterHandler {
  static register() { return NexusEventBus.on('hr.application_received', async (payload) => {
      console.log(`[RecruitmentRouterHandler] Nouvelle candidature reçue pour le poste de ${payload.role}`);

      empireAudit.log({
        action: 'hr.application_received',
        module: 'human',
        userId: 'system',
        instanceId: payload.tenantId,
        details: {
          applicationId: payload.applicationId,
          role: payload.role,
          applicantName: payload.applicantName
        },
        severity: 'low',
        timestamp: new Date(),
});

      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId: payload.tenantId,
        id: `alert-recruitment-${payload.applicationId}`,
        type: 'info',
        title: 'Nouvelle Candidature',
        message: `${payload.applicantName} a postulé pour le poste : ${payload.role}.`,
        priority: 'low',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
