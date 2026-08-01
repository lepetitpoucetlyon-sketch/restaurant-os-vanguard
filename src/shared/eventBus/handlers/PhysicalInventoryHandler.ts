import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerPhysicalInventoryHandler() {
  return NexusEventBus.on(
    'inventory.physical',
    async (payload) => {
      const { tenantId, items, operatorId, inventoryId } = payload;
      
      const totalDiscrepancyAmount = 0;
      
      for (const item of items) {
        const { itemId, theoreticalQty, physicalQty } = item;
        const diff = physicalQty - theoreticalQty;
        
        if (diff !== 0) {
          // Mettre à jour la quantité en base
          const path = `tenants/${tenantId}/stockItems/${itemId}`;
          await Nexus.adapter.update(path, {
            quantity: physicalQty,
            updatedAt: Date.now(),
          });

          logger.info(`[PhysicalInventory] ${itemId}: Théorique=${theoreticalQty}, Réel=${physicalQty}. Dérive=${diff}`);
          
          // Si on veut calculer la valeur de la démarque, on devrait lire le stockItem pour avoir le cost
          // Ici on logge juste la quantité.
        }
      }

      empireAudit.log({
        module: 'inventory',
        action: 'PHYSICAL_INVENTORY_COMPLETED',
        details: { inventoryId, operatorId, itemsCount: items.length },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'physical-inventory-handler', priority: 'HIGH' }
  );
}
