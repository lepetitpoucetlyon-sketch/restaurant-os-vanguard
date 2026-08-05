import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerTrainingComplianceAlertHandler(): () => void {
  return NexusEventBus.on(
    'hr.training_expired',
    async (payload) => {
      const { tenantId, employeeId, trainingType } = payload;
      logger.warn(`[TrainingCompliance] Formation expirée pour ${employeeId} (Type: ${trainingType})`);

      await Nexus.adapter.update(`tenants/${tenantId}/employees/${employeeId}`, {
        trainingBlockActive: true,
        blockedTraining: trainingType,
        trainingBlockedAt: new Date().toISOString(),
      });

      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId,
        message: `Formation "${trainingType}" expirée pour l'employé ${employeeId}. Accès pointeuse suspendu jusqu'au renouvellement.`,
        roles: ['admin', 'manager'],
        priority: 'HIGH',
      });

      empireAudit.log({
        module: 'human',
        action: 'TRAINING_EXPIRED_BLOCK',
        details: { employeeId, trainingType },
        severity: 'high',
        timestamp: new Date(),
      });
    },
    { id: 'training-compliance-alert-handler', priority: 'HIGH' }
  );
}
