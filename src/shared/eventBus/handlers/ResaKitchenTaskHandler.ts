import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

/**
 * ResaKitchenTaskHandler (P05-C)
 * Écoute 'resa.j1' (même événement que ResaReminderHandler).
 * Crée des tâches cuisine si le groupe est supérieur à 8 couverts.
 * Pour les groupes > 20 : tâche supplémentaire 'grand_banquet'.
 */
export function registerResaKitchenTaskHandler(): () => void {
  return NexusEventBus.on(
    'resa.j1',
    async (payload) => {
      const { tenantId, reservationId, covers, date } = payload;

      if (covers <= 8) {
        logger.info(`[ResaKitchenTask] ${covers} couverts ≤ 8 — pas de tâche cuisine pour réservation ${reservationId}`);
        return;
      }

      // Planifié J-1 à 16h00
      const scheduledDate = new Date(date);
      scheduledDate.setDate(scheduledDate.getDate() - 1);
      scheduledDate.setHours(16, 0, 0, 0);
      const scheduledFor = scheduledDate.toISOString();
      const createdAt = new Date().toISOString();

      await Nexus.adapter.set(
        `tenants/${tenantId}/kitchenTasks/TASK-PREP-${reservationId}`,
        {
          type: 'preparation',
          reservationId,
          covers,
          scheduledFor,
          assignedTo: 'chef_cuisinier',
          status: 'pending',
          createdAt,
        },
      );

      logger.info(`[ResaKitchenTask] Tâche préparation créée pour réservation ${reservationId} (${covers} couverts, J-1 16h)`);

      if (covers > 20) {
        await Nexus.adapter.set(
          `tenants/${tenantId}/kitchenTasks/TASK-BANQUET-${reservationId}`,
          {
            type: 'grand_banquet',
            reservationId,
            covers,
            scheduledFor,
            assignedTo: 'chef_cuisinier',
            status: 'pending',
            createdAt,
          },
        );
        logger.info(`[ResaKitchenTask] Tâche grand_banquet créée pour réservation ${reservationId} (${covers} couverts)`);
      }

      empireAudit.log({
        module: 'ops',
        action: 'KITCHEN_TASK_CREATED_FOR_RESA',
        details: { reservationId, covers, scheduledFor, grandBanquet: covers > 20 },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'resa-kitchen-task', priority: 'BACKGROUND' },
  );
}
