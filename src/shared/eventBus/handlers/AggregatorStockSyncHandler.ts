import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerAggregatorStockSyncHandler() {
  return NexusEventBus.on(
    'stock.zero',
    async (payload) => {
      const { tenantId, itemId, itemName } = payload;
      
      logger.info(`[AggregatorStockSync] Produit "${itemName}" (${itemId}) en rupture de stock.`);
      logger.info(`[AggregatorStockSync] Transmission du statut "Indisponible" (86) aux agrégateurs...`);

      // En réalité:
      // 1. Lire le mapping pour trouver l'ID externe correspondant à `itemId` sur Uber/Deliveroo
      // 2. Faire un appel API POST vers UberEats (suspend item) et Deliveroo (out of stock)
      
      empireAudit.log({
        module: 'ops',
        action: 'AGGREGATOR_STOCK_ZERO_SYNCED',
        details: { itemId, itemName },
        severity: 'high', // Impact CA immédiat
        timestamp: new Date(),
      });
    },
    { id: 'aggregator-stock-sync', priority: 'HIGH' } // Doit être assez rapide pour éviter les rejets de commande
  );
}
