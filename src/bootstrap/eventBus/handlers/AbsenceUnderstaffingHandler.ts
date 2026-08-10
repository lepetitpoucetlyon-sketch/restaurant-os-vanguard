import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

export class AbsenceUnderstaffingHandler {
  static register() { 
    return NexusEventBus.on('hr.absence_declared', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, userId, absenceType, startDate } = payload;
      logger.info(`[AbsenceUnderstaffingHandler] Checking schedule for tenant ${tenantId} due to absence of ${userId}`);

      try {
        // Retrieve the schedule for the given date
        const scheduleRef = await Nexus.adapter.query<{ id: string; requiredHeadcount: number; scheduledHeadcount: number }>(`hr/schedules`, {
            where: [{ field: 'date', operator: '==', value: startDate }]
        });
        
        const schedule = scheduleRef[0];
        
        if (schedule) {
            const newHeadcount = schedule.scheduledHeadcount - 1;
            // Update the schedule
            await Nexus.adapter.update(`tenants/${tenantId}/hr/schedules/${schedule.id}`, {
                scheduledHeadcount: newHeadcount,
                updatedAt: Date.now()
            });

            if (newHeadcount < schedule.requiredHeadcount) {
                empireAudit.log({
                    action: 'hr.absence_understaffing_alert',
                    module: 'human',
                    userId: 'system',
                    instanceId: tenantId,
                    details: {
                    absentUserId: userId,
                    startDate: startDate,
                    status: 'alert_raised',
                    headcount: newHeadcount,
                    required: schedule.requiredHeadcount
                    },
                    severity: 'high',
                    timestamp: new Date(),
                });

                await NexusEventBus.emitDurable('anomaly.detected', {
                    v: 1,
                    tenantId,
                    type: 'understaffing',
                    message: `Sous-effectif détecté le ${startDate}: ${newHeadcount}/${schedule.requiredHeadcount} personnes`,
                    metadata: { absentUserId: userId, absenceType, headcount: newHeadcount, required: schedule.requiredHeadcount },
                });

                NexusEventBus.emitDurable('notification.created', {
                    v: 1,
                    tenantId: tenantId,
                    id: `alert-absence-${Date.now()}`,
                    type: 'alert',
                    title: 'Risque de Sous-Effectif',
                    message: `L'absence de l'employé(e) engendre un risque de sous-effectif (${newHeadcount}/${schedule.requiredHeadcount}). Veuillez vérifier le planning.`,
                    priority: 'high',
                    read: false,
                    timestamp: new Date().toISOString()
                });
            }
        }
      } catch (err) {
          logger.error('[AbsenceUnderstaffingHandler] Error checking schedule', toError(err).message);
          throw err;
      }
    }, { id: 'absence-understaffing', priority: 'HIGH' });
  }
}
