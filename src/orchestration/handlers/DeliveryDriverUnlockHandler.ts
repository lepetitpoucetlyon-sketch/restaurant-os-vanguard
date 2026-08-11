import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerDeliveryDriverUnlockHandler() {
  return NexusEventBus.on(
    'delivery.delivered',
    async (payload) => {
      const { orderId, driverId } = payload;
      
      if (!driverId) return;

      logger.info(`[Delivery] Commande ${orderId} livrée. Libération du livreur ${driverId}.`);
      
      empireAudit.log({
        module: 'ops',
        action: 'DRIVER_UNLOCKED',
        details: { orderId, driverId },
        severity: 'low',
        timestamp: new Date(),
      });
      
      // Ici, on pourrait mettre à jour le statut du livreur dans une table `drivers`
      // await Nexus.adapter.update(`tenants/${tenantId}/drivers/${driverId}`, { status: 'available' });
    },
    { id: 'delivery-driver-unlock-handler', priority: 'BACKGROUND' }
  );
}
