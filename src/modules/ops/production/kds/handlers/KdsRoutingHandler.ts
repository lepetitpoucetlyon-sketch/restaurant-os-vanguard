import { NexusEventBus } from '../../../../../shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

export function registerKdsRoutingHandler() {
  return NexusEventBus.on(
    'order.placed',
    async (payload) => {
      const { tenantId, orderId, items } = payload;
      
      // En réalité, il faudrait lire les catégories de produits pour déterminer la "station".
      // Pour l'implémentation de base V5, on sépare en 2 stations fictives (chaud / froid) 
      // ou on envoie tout à une station globale.
      
      const kdsItems = (items || []).map((item: import('@/modules/ops/domain/schemas/pos').CartItem & { course?: number }, _idx: number) => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        course: item.course || 1, // Entrée (1), Plat (2), Dessert (3)
      }));

      // Sauvegarde du ticket KDS en base
      const ticketId = `kds_${orderId}`;
      await Nexus.adapter.set(`tenants/${tenantId}/kdsTickets/${ticketId}`, {
        id: ticketId,
        orderId,
        status: 'received',
        items: kdsItems,
        receivedAt: Date.now(),
      });

      // Emission de l'événement vers les écrans
      await NexusEventBus.emitDurable('kds.ticket_received', {
        v: 1,
        tenantId,
        orderId,
        items: kdsItems,
      });

      empireAudit.log({
        module: 'ops',
        action: 'KDS_TICKET_ROUTED',
        details: { orderId, itemsCount: kdsItems.length },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'kds-routing-handler', priority: 'HIGH' }
  );
}
