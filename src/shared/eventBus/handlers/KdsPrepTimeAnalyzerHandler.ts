import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerKdsPrepTimeAnalyzerHandler() {
  return NexusEventBus.on(
    'kds.item_done',
    async (payload) => {
      const { tenantId, orderId, itemId } = payload;
      
      const ticketId = `kds_${orderId}`;
      const ticket = await Nexus.adapter.get<any>(`tenants/${tenantId}/kdsTickets/${ticketId}`);
      
      if (!ticket) return;

      const item = ticket.items.find((i: any) => i.id === itemId);
      if (!item) return;

      // Met à jour le statut
      item.status = 'done';
      item.doneAt = Date.now();
      
      // Analyse du temps
      if (item.startedAt) {
        const elapsedMinutes = Math.round((item.doneAt - item.startedAt) / 60000);
        const targetMinutes = 15; // Temps théorique (en vrai, à lire depuis la Recette)

        if (elapsedMinutes > targetMinutes) {
          logger.warn(`[KDS] Retard détecté sur ${item.name} (Table/Order: ${orderId}) : ${elapsedMinutes}min`);
          
          await NexusEventBus.emitDurable('kds.rush_alert', {
            v: 1,
            tenantId,
            orderId,
            itemId,
            exceededByMinutes: elapsedMinutes - targetMinutes
          });
        }
      }

      await Nexus.adapter.update(`tenants/${tenantId}/kdsTickets/${ticketId}`, {
        items: ticket.items,
        updatedAt: Date.now(),
      });

      // Vérifier si TOUT le ticket est prêt
      const allDone = ticket.items.every((i: any) => i.status === 'done');
      if (allDone && ticket.status !== 'done') {
        await Nexus.adapter.update(`tenants/${tenantId}/kdsTickets/${ticketId}`, {
          status: 'done',
          doneAt: Date.now(),
        });
        await NexusEventBus.emitDurable('kds.ticket_done', {
          v: 1,
          tenantId,
          orderId,
        });
      }

      empireAudit.log({
        module: 'ops',
        action: 'KDS_ITEM_DONE',
        details: { orderId, itemId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'kds-prep-time-analyzer', priority: 'HIGH' }
  );
}
