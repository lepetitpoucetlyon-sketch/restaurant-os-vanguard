import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

/**
 * TrainingComplianceAlertHandler (P03-G)
 * Réagit à 'hr.training_expired' (par exemple formation hygiène HACCP)
 * et déclenche une alerte RH ou bloque la pointeuse de l'employé.
 */
export function registerTrainingComplianceAlertHandler(): () => void {
  return NexusEventBus.on(
    'hr.training_expired',
    async (payload) => {
      logger.warn(`[TrainingCompliance] Formation expirée pour ${payload.employeeId} (Type: ${payload.trainingType})`);

      // TODO: Logique pour bloquer la pointeuse ou envoyer une alerte RH (Push)
      empireAudit.log({
        module: 'human',
        action: 'training_expired_alert',
        details: {
          employeeId: payload.employeeId,
          trainingType: payload.trainingType,
        },
        severity: 'high',
        timestamp: new Date(),
      });
    },
    { id: 'training-compliance-alert-handler', priority: 'HIGH' }
  );
}
