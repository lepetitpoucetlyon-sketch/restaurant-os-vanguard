import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export function registerKDSOrderHandler() {
  return NexusEventBus.on(
    'order.placed',
    async (payload) => {
      const { orderId, tenantId, items, tableId } = payload;
      
      // Filtrer les items qui ont besoin d'être préparés en cuisine (ex: pas les boissons déjà servies)
      // On simplifie ici en envoyant tout, la logique KDS filtrera ou on filtre sur un flag 'requiresPrep'
      const kdsItems = items.map(item => ({
        ...item,
        status: 'pending',
      }));

      if (kdsItems.length === 0) return;

      // Envoyer la commande au KDS
      await Nexus.adapter.set(`tenants/${tenantId}/kdsOrders/${orderId}`, {
        orderId,
        tableId,
        status: 'pending', // 'pending' | 'preparing' | 'ready' | 'served'
        items: kdsItems,
        receivedAt: new Date().toISOString(),
      });
    },
    { id: 'kds-order-handler', priority: 'HIGH' }
  );
}
