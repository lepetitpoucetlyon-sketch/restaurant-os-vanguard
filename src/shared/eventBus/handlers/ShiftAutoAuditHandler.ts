/**
 * ShiftAutoAuditHandler — I5 : Clôture Z → RH
 *
 * Quand le ticket Z est clôturé (`finance.ticket_z_closed`), détecte automatiquement
 * les employés qui n'ont pas pointé leur sortie (CLOCK_OUT manquant) pendant le service.
 * Crée une alerte RH + notification manager pour régularisation.
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

interface ShiftEntry {
  type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  userId: string;
  userName?: string;
  timestamp: string;
}

export function registerShiftAutoAuditHandler(): () => void {
  return NexusEventBus.on(
    'finance.ticket_z_closed',
    async (payload) => {
      const { tenantId, date, totalInMicrounits } = payload;

      try {
        // Fenêtre de service : le jour de la clôture Z (0h → 23h59)
        const dayStart = new Date(`${date}T00:00:00Z`).toISOString();
        const dayEnd = new Date(`${date}T23:59:59Z`).toISOString();

        const entries = await Nexus.adapter.query<ShiftEntry>(
          `tenants/${tenantId}/shiftEntries`,
          {
            where: [
              { field: 'timestamp', operator: '>=', value: dayStart },
              { field: 'timestamp', operator: '<=', value: dayEnd },
            ],
            orderBy: { field: 'timestamp', direction: 'asc' },
          }
        );

        // Construire l'état de pointage par employé
        const clockState = new Map<string, { name?: string; clockedIn: boolean; lastIn: string }>();
        for (const e of entries) {
          if (e.type === 'CLOCK_IN') {
            clockState.set(e.userId, { name: e.userName, clockedIn: true, lastIn: e.timestamp });
          } else if (e.type === 'CLOCK_OUT') {
            const s = clockState.get(e.userId);
            if (s) s.clockedIn = false;
          }
        }

        // Filtrer les employés encore "clockedIn" à la clôture Z
        const forgottenClockOuts: Array<{ userId: string; name?: string; lastIn: string }> = [];
        for (const [userId, state] of clockState.entries()) {
          if (state.clockedIn) {
            forgottenClockOuts.push({ userId, name: state.name, lastIn: state.lastIn });
          }
        }

        if (forgottenClockOuts.length === 0) {
          logger.info(`[ShiftAutoAudit] Clôture Z ${date} — tous les pointages corrects.`);
          return;
        }

        // Créer des alertes RH pour chaque oubli
        const now = Date.now();
        for (const employee of forgottenClockOuts) {
          const alertId = `shift-audit-${employee.userId}-${date}`;
          await Nexus.adapter.set(
            `tenants/${tenantId}/hrAlerts/${alertId}`,
            {
              id: alertId,
              type: 'missing_clock_out',
              employeeId: employee.userId,
              employeeName: employee.name ?? employee.userId,
              lastClockIn: employee.lastIn,
              detectedAt: new Date(now).toISOString(),
              triggerEvent: 'finance.ticket_z_closed',
              serviceDate: date,
              status: 'open',
              severity: 'medium',
            }
          );
        }

        // Notifier les managers
        const names = forgottenClockOuts.map(e => e.name ?? e.userId).join(', ');
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `⚠️ Clôture Z ${date} — Pointages de sortie manquants : ${names}`,
          roles: ['manager', 'directeur', 'admin'],
          priority: 'HIGH',
        });

        logger.warn(
          `[ShiftAutoAudit] ${forgottenClockOuts.length} pointage(s) de sortie manquant(s) après clôture Z ${date}`
        );

        empireAudit.log({
          module: 'compliance',
          action: 'MISSING_CLOCK_OUT_AFTER_Z',
          details: {
            serviceDate: date,
            totalInMicrounits,
            forgottenCount: forgottenClockOuts.length,
            employees: forgottenClockOuts.map(e => e.userId),
          },
          severity: 'medium',
          timestamp: new Date(now),
        });
      } catch (err) {
        logger.error('[ShiftAutoAudit] Erreur audit pointages clôture Z', err);
        throw err;
      }
    },
    { id: 'shift-auto-audit', priority: 'HIGH' }
  );
}
