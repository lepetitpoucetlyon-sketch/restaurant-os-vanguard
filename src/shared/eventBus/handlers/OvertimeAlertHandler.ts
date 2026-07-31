import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerOvertimeAlertHandler() {
  return NexusEventBus.on(
    'hr.shift_ended',
    async (payload) => {
      const { tenantId, shiftId, employeeId, endedAt } = payload;
      
      const shift = await Nexus.adapter.get<any>(`tenants/${tenantId}/shifts/${shiftId}`);
      
      if (shift && shift.startedAt) {
        const durationHours = (endedAt - shift.startedAt) / 3600000;
        
        // Règle métier : Alerte si la durée du shift dépasse 10 heures (légal HCR)
        if (durationHours > 10) {
          logger.warn(`[OvertimeAlert] Employé ${employeeId} a effectué un shift de ${durationHours.toFixed(2)} heures. (Dépassement du plafond légal de 10h).`);
          
          // On ne bloque pas (car l'employé doit pouvoir pointer), mais on trace une infraction légale
          // qui remontera dans le tableau de bord RH.
          
          await Nexus.adapter.set(`tenants/${tenantId}/hrAlerts/${shiftId}`, {
            employeeId,
            shiftId,
            alertType: 'LEGAL_OVERTIME_BREACH',
            durationHours,
            thresholdHours: 10,
            status: 'unresolved',
            createdAt: Date.now()
          });

          empireAudit.log({
            module: 'human',
            action: 'LEGAL_OVERTIME_BREACH',
            details: { employeeId, durationHours },
            severity: 'high',
            timestamp: new Date(),
          });
        }
      }
    },
    { id: 'overtime-alert', priority: 'HIGH' }
  );
}
