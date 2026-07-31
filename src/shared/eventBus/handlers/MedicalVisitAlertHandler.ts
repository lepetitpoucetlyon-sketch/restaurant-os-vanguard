import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';

export class MedicalVisitAlertHandler {
  static register() { return NexusEventBus.on('hr.medical_visit_expired', async (payload) => {
      console.log(`[MedicalVisitAlertHandler] Visite médicale expirée pour ${payload.userId} (Retard: ${payload.daysOverdue} jours)`);

      empireAudit.log({
        action: 'hr.medical_visit_expired_alert',
        module: 'human',
        userId: 'system',
        instanceId: payload.tenantId,
        details: {
          expiredUserId: payload.userId,
          daysOverdue: payload.daysOverdue
        },
        severity: 'high',
        timestamp: new Date(),
});

      // Alerte pour le manager
      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId: payload.tenantId,
        id: `alert-medical-${payload.userId}-${Date.now()}`,
        type: 'alert',
        title: 'Visite Médicale Expirée',
        message: `La visite médicale de l'employé est expirée depuis ${payload.daysOverdue} jours. Risque de non-conformité légale.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
