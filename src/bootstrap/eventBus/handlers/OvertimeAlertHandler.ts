import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

interface ShiftRecord {
  startedAt?: number;
}

export function registerOvertimeAlertHandler() {
  const unsubShiftEnded = NexusEventBus.on(
    'hr.shift_ended',
    async (payload) => {
      const { tenantId, shiftId, employeeId, endedAt } = payload;
      
      const shift = await Nexus.adapter.get<ShiftRecord>(`tenants/${tenantId}/shifts/${shiftId}`);
      
      if (shift && shift.startedAt) {
        const durationHours = (endedAt - shift.startedAt) / 3600000;
        
        // Règle métier : Alerte si la durée du shift dépasse 10 heures (légal HCR)
        if (durationHours > 10) {
          logger.warn(`[OvertimeAlert] Employé ${employeeId} a effectué un shift de ${durationHours.toFixed(2)} heures. (Dépassement du plafond légal de 10h).`);
          
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
    }
  );

  const unsubOvertimeAlert = NexusEventBus.on(
    'hr.overtime_alert',
    async (payload) => {
      const { tenantId, employeeId, extraMinutes } = payload;
      logger.warn(`[OvertimeAlert] Employé ${employeeId} a cumulé ${extraMinutes} minutes d'heures supplémentaires.`);
      
      const alertId = `ot_${employeeId}_${Date.now()}`;
      await Nexus.adapter.set(`tenants/${tenantId}/hrAlerts/${alertId}`, {
        employeeId,
        extraMinutes,
        alertType: 'OVERTIME_ALERT',
        status: 'unresolved',
        createdAt: Date.now()
      });

      empireAudit.log({
        module: 'human',
        action: 'OVERTIME_ALERT',
        details: { employeeId, extraMinutes },
        severity: 'medium',
        timestamp: new Date(),
      });
    }
  );

  const unsubThreshold = NexusEventBus.on(
    'overtime.threshold',
    async (payload) => {
      const { tenantId, employeeId, hoursWorked, hoursLimit } = payload;
      const extraMinutes = Math.max(0, Math.round(((hoursWorked ?? 0) - (hoursLimit ?? 35)) * 60));
      await NexusEventBus.emit('hr.overtime_alert', {
        tenantId,
        employeeId,
        extraMinutes,
      });
    }
  );

  return () => {
    unsubShiftEnded();
    unsubOvertimeAlert();
    unsubThreshold();
  };
}
