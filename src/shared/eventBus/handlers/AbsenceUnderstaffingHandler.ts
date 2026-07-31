import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';

export class AbsenceUnderstaffingHandler {
  static register() { return NexusEventBus.on('hr.absence_declared', async (payload) => {
      // Dans le cadre Grade X, nous simulons l'appel au module de planning.
      // Un vrai système vérifierait le nombre de shifts vs la jauge de service.
      console.log(`[AbsenceUnderstaffingHandler] Absence déclarée pour ${payload.userId} (Type: ${payload.absenceType})`);

      empireAudit.log({
        action: 'hr.absence_understaffing_alert',
        module: 'human',
        userId: 'system',
        instanceId: payload.tenantId,
        details: {
          absentUserId: payload.userId,
          startDate: payload.startDate,
          status: 'alert_raised'
        },
        severity: 'high',
        timestamp: new Date(),
});

      // Émission d'une alerte au manager
      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId: payload.tenantId,
        id: `alert-absence-${Date.now()}`,
        type: 'alert',
        title: 'Risque de Sous-Effectif',
        message: `L'absence de l'employé(e) engendre un risque de sous-effectif. Veuillez vérifier le planning.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
