import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class MedicalVisitAlertHandler {
  static register() { 
    return NexusEventBus.on('hr.medical_visit_expired', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, userId, daysOverdue, expiryDate: _expiryDate } = payload;
      logger.info(`[MedicalVisitAlertHandler] Visite médicale expirée pour ${userId} (Retard: ${daysOverdue} jours)`);

      try {
        const docRef = await Nexus.adapter.query<{ id: string; status: string; employeeName: string }>(`tenants/${tenantId}/hr/employees`, {
            where: [{ field: 'id', operator: '==', value: userId }]
        });
        
        const employee = docRef[0];
        if (employee && employee.status === 'active') {
            await Nexus.adapter.update(`tenants/${tenantId}/hr/employees/${userId}`, {
                medicalVisitAlertTriggered: true,
                updatedAt: Date.now()
            });

            empireAudit.log({
                action: 'hr.medical_visit_expired_alert',
                module: 'human',
                userId: 'system',
                instanceId: tenantId,
                details: {
                expiredUserId: userId,
                daysOverdue: daysOverdue,
                employeeName: employee.employeeName
                },
                severity: 'high',
                timestamp: new Date(),
            });

            // Alerte pour le manager
            NexusEventBus.emitDurable('notification.created', {
                v: 1,
                tenantId: tenantId,
                id: `alert-medical-${userId}-${Date.now()}`,
                type: 'alert',
                title: 'Visite Médicale Expirée',
                message: `La visite médicale de l'employé(e) ${employee.employeeName || ''} est expirée depuis ${daysOverdue} jours. Risque de non-conformité légale.`,
                priority: 'high',
                read: false,
                timestamp: new Date().toISOString()
            });
        }
      } catch (err) {
        logger.error('[MedicalVisitAlertHandler] Error fetching employee data', String(err));
      }
    }, { id: 'medical-visit-alert', priority: 'BACKGROUND' });
  }
}
