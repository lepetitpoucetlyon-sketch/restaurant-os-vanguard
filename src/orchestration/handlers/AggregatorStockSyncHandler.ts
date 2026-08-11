/* eslint-disable no-restricted-imports -- tolerated structural inversion */
import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { AggregatorMappingService } from '@/modules/commerce/relation/delivery/services/AggregatorMappingService';

export function registerAggregatorStockSyncHandler() {
  return NexusEventBus.on(
    'stock.zero',
    async (payload) => {
      const { tenantId, itemId, itemName } = payload;
      
      logger.info(`[AggregatorStockSync] Produit "${itemName}" (${itemId}) en rupture de stock.`);
      logger.info(`[AggregatorStockSync] Transmission du statut "Indisponible" (86) aux agrégateurs...`);

      // 1. Lire les intégrations actives et leurs mappings
      const activeIntegrations = await AggregatorMappingService.getActiveAdapters(tenantId);
      let syncCount = 0;

      // 2. Transmettre le statut 86 à chaque plateforme
      for (const { adapter, mappings } of activeIntegrations) {
          const externalId = AggregatorMappingService.resolveExternalId(itemId, mappings);
          if (externalId) {
              const success = await adapter.suspendItem(tenantId, externalId);
              if (success) syncCount++;
          } else {
              logger.warn(`[AggregatorStockSync] Impossible de trouver le mapping de "${itemName}" (${itemId}) pour la plateforme ${adapter.platformId}`);
          }
      }
      
      empireAudit.log({
        module: 'ops',
        action: 'AGGREGATOR_STOCK_ZERO_SYNCED',
        details: { itemId, itemName, syncCount },
        severity: 'high', // Impact CA immédiat
        timestamp: new Date(),
      });
    },
    { id: 'aggregator-stock-sync', priority: 'HIGH' } // Doit être assez rapide pour éviter les rejets de commande
  );
}
