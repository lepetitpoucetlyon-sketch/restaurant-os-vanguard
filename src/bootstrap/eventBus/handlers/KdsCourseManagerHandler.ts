import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import type { KdsTicket, KdsItem } from './_handler-types';

export function registerKdsCourseManagerHandler() {
  return NexusEventBus.on(
    'kds.course_fired',
    async (payload) => {
      const { tenantId, orderId, course } = payload;
      
      const ticketId = `kds_${orderId}`;
      const ticket = await Nexus.adapter.get<KdsTicket>(`tenants/${tenantId}/kdsTickets/${ticketId}`);
      
      if (ticket) {
        // Mettre à jour le statut des items de ce "course" (envoi)
        const updatedItems = ticket.items.map((item: KdsItem) => {
          if (item.course === course) {
            return { ...item, status: 'fired', firedAt: Date.now() };
          }
          return item;
        });

        await Nexus.adapter.update(`tenants/${tenantId}/kdsTickets/${ticketId}`, {
          items: updatedItems,
          updatedAt: Date.now(),
        });
      }

      empireAudit.log({
        module: 'ops',
        action: 'KDS_COURSE_FIRED',
        details: { orderId, course },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'kds-course-manager-handler', priority: 'HIGH' }
  );
}
