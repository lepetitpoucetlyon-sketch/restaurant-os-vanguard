import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';
import { toError } from "@/lib/toError";

interface ShiftRecord {
  id?: string;
  employeeId: string;
  weekStart: number;
  date: string;
  startTime: string;
  endTime: string;
  role?: string;
}

export function registerScheduleNotifierHandler() {
  return NexusEventBus.on(
    'hr.schedule_published',
    async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, weekStart, publishedBy } = payload;

      const weekDate = new Date(weekStart).toLocaleDateString('fr-FR');
      logger.info(`[ScheduleNotifier] Planning publié pour la semaine du ${weekDate}. Envoi des notifications à la brigade.`);

      try {
        // Requête des shifts de la semaine publiée
        const shifts = await Nexus.adapter.query<ShiftRecord>(
          `tenants/${tenantId}/planning/shifts`,
          {
            where: [{ field: 'weekStart', operator: '==', value: weekStart }],
          }
        );

        if (shifts.length === 0) {
          logger.warn(`[ScheduleNotifier] Aucun shift trouvé pour weekStart=${weekStart}`);
          return;
        }

        // Extraire les employés uniques concernés
        const employeeIds = [...new Set(shifts.map(s => s.employeeId))];
        logger.info(`[ScheduleNotifier] ${shifts.length} shifts, ${employeeIds.length} employés concernés`);

        // Créer une notification individuelle pour chaque employé
        const now = Date.now();
        await Promise.allSettled(
          employeeIds.map((empId, idx) => {
            const empShifts = shifts.filter(s => s.employeeId === empId);
            const shiftSummary = empShifts
              .map(s => `${s.date} ${s.startTime}-${s.endTime}`)
              .join(', ');

            return Nexus.adapter.set(
              `tenants/${tenantId}/notifications/schedule-${empId}-${now + idx}`,
              {
                userId: empId,
                type: 'schedule_published',
                title: 'Planning publié',
                message: `Votre planning semaine du ${weekDate} : ${shiftSummary}`,
                read: false,
                createdAt: now,
              }
            );
          })
        );

        // Notification push groupée pour le personnel de salle et cuisine
        await browserPush.sendToRole(tenantId, 'serveur', {
          title: 'Nouveau planning disponible',
          body: `Le planning de la semaine du ${weekDate} a été publié. Consultez vos horaires.`,
        });

        await browserPush.sendToRole(tenantId, 'cuisinier', {
          title: 'Nouveau planning disponible',
          body: `Le planning de la semaine du ${weekDate} a été publié. Consultez vos horaires.`,
        });

        NexusEventBus.emitDurable('notification.created', {
          v: 1,
          tenantId,
          id: `schedule-pub-${weekStart}-${now}`,
          type: 'info',
          title: 'Planning publié',
          message: `Le planning semaine du ${weekDate} a été publié pour ${employeeIds.length} employés (${shifts.length} shifts).`,
          priority: 'medium',
          read: false,
          timestamp: new Date().toISOString(),
        });

        empireAudit.log({
          module: 'human',
          action: 'SCHEDULE_NOTIFIED',
          userId: publishedBy || 'system',
          instanceId: tenantId,
          details: {
            weekStart,
            publishedBy,
            employeeCount: employeeIds.length,
            shiftCount: shifts.length,
          },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('[ScheduleNotifier] Erreur lors de la notification:', toError(error).message);
      }
    },
    { id: 'schedule-notifier', priority: 'BACKGROUND' }
  );
}
