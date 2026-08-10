import { NexusEventBus } from '../NexusEventBus';
import { SharedKernel } from '@/lib/shared-kernel';

export function registerKDSReadyHandler() {
  return NexusEventBus.on(
    'kds.item_done',
    async (payload) => {
      const { tenantId, orderId, itemId } = payload;
      
      // Mettre à jour l'item dans le kdsOrders existant (on pourrait aussi écouter côté client KDS, 
      // mais ici on assure la consistance en base si nécessaire ou on laisse faire l'UI KDS).
      // Dans une implémentation complète, on ferait un update sur l'item spécifique de la commande KDS.
      
      // On notifie le serveur que le plat est prêt
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId,
        id: SharedKernel.generateId('notif'),
        type: 'info',
        title: 'Plat prêt',
        message: `Le plat pour la commande ${orderId} est prêt à être envoyé.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
      });
    },
    { id: 'kds-ready-handler', priority: 'HIGH' }
  );
}
