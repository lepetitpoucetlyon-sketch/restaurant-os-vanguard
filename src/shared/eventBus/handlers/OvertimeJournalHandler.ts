import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { WebPushService } from '@/lib/push/webPushService';
import { logger } from '@/lib/logger';

/**
 * OvertimeJournalHandler (P04-D)
 * Écoute overtime.threshold et :
 * 1. Crée une alerte RH dans hr/alerts
 * 2. Notifie le manager par WebPush
 * 3. Pose un flag bulletin dans hr/payrollFlags pour la fiche de paie
 */
export function registerOvertimeJournalHandler(): () => void {
  return NexusEventBus.on(
    'overtime.threshold',
    async (payload) => {
      const { tenantId, employeeId, hoursWorked, hoursLimit, periodStart, periodEnd } = payload;

      const employee = await Nexus.adapter.get<{ firstName?: string; lastName?: string; name?: string }>(
        `tenants/${tenantId}/hr/employees/${employeeId}`
      );

      const employeeName =
        employee
          ? (employee.name ?? [employee.firstName, employee.lastName].filter(Boolean).join(' ')) || employeeId
          : employeeId;

      const overtimeHours = hoursWorked - hoursLimit;
      const alertId = `OT-${employeeId}-${periodStart}`;
      const now = new Date().toISOString();

      // 1. Créer l'alerte RH
      await Nexus.adapter.set(`tenants/${tenantId}/hr/alerts/${alertId}`, {
        type: 'overtime',
        employeeId,
        employeeName,
        overtimeHours,
        hoursWorked,
        hoursLimit,
        periodStart,
        periodEnd,
        status: 'pending',
        createdAt: now,
      });

      logger.info(`[OvertimeJournal] Alerte ${alertId} créée — ${overtimeHours}h sup pour ${employeeName}`);

      // 2. WebPush manager
      await WebPushService.sendToRole(tenantId, 'manager', {
        title: `Heures sup — ${employeeName}`,
        body: `${overtimeHours}h dépassées sur la période`,
      });

      // 3. Flag bulletin de paie
      await Nexus.adapter.set(`tenants/${tenantId}/hr/payrollFlags/${alertId}`, {
        type: 'overtime_mention',
        employeeId,
        overtimeHours,
        periodStart,
        forBulletin: true,
      });

      // 4. Audit
      empireAudit.log({
        module: 'compliance',
        action: 'OVERTIME_ALERT_CREATED',
        details: { alertId, employeeId, employeeName, overtimeHours, hoursWorked, hoursLimit, periodStart, periodEnd },
        severity: 'high',
        timestamp: new Date(),
      });
    },
    { id: 'overtime-journal', priority: 'HIGH' }
  );
}
