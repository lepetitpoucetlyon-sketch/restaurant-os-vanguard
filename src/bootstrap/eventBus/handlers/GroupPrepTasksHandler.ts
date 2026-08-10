import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';

export function registerGroupPrepTasksHandler() {
  return NexusEventBus.on(
    'reservation.large_group',
    async (payload) => {
      const { tenantId, reservationId, covers, datetime } = payload;
      
      const taskId = SharedKernel.generateId('PT'); // Prep Task
      
      // Créer une tâche de préparation pour la cuisine
      await Nexus.adapter.set(`tenants/${tenantId}/prepTasks/${taskId}`, {
        id: taskId,
        reservationId,
        covers,
        datetime,
        status: 'pending',
        title: `Préparation pour grand groupe (${covers} couverts)`,
        description: `Veuillez anticiper la mise en place et les cuissons longues pour le groupe prévu le ${datetime}`,
        createdAt: new Date().toISOString(),
      });
      
      // Notifier le chef
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId,
        id: SharedKernel.generateId('notif'),
        type: 'warning',
        title: 'Nouveau grand groupe',
        message: `Une réservation pour ${covers} personnes a été ajoutée. Tâches de prép créées.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
      });
    },
    { id: 'group-prep-tasks-handler', priority: 'BACKGROUND' }
  );
}
