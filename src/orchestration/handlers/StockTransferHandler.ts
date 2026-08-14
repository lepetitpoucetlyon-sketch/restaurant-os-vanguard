import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/**
 * Gère l'événement `stock.transfer`.
 *
 * Sémantique : transfert INTRA-TENANT d'emplacement de stockage.
 * Un seul document StockItem (identifié par tenantId + itemId) voit son champ
 * `storageLocationId` passer de `fromLocationId` à `toLocationId`.
 * Il n'y a pas de déduction/crédit de quantité — la quantité physique ne change pas,
 * seul l'emplacement change.
 *
 * ⚠️ fromLocationId et toLocationId sont des emplacements de stockage (ref. DEFAULT_STORAGE_LOCATIONS),
 * pas des tenantIds. Le chemin Nexus utilise toujours le `tenantId` fourni dans le payload.
 */
export function registerStockTransferHandler() {
  return NexusEventBus.on(
    'stock.transfer',
    async (payload) => {
      const { tenantId, fromLocationId, toLocationId, itemId, quantity, operatorId } = payload;

      const itemPath = `tenants/${tenantId}/stockItems/${itemId}`;

      const item = await Nexus.adapter.get<{ storageLocationId?: string; quantity?: number }>(itemPath);
      if (!item) {
        logger.warn('[StockTransferHandler] stockItem introuvable', { tenantId, itemId });
        return;
      }

      // Mise à jour de l'emplacement — la quantité reste inchangée (transfert physique, pas de scission)
      await Nexus.adapter.update(itemPath, {
        storageLocationId: toLocationId,
        updatedAt: Date.now(),
      });

      empireAudit.log({
        module: 'inventory',
        action: 'STOCK_TRANSFERRED',
        details: {
          tenantId,
          itemId,
          fromLocationId,
          toLocationId,
          quantity,
          operatorId,
          previousLocationId: item.storageLocationId,
        },
        severity: 'medium',
        timestamp: new Date(),
      });

      logger.info('[StockTransferHandler] transfert enregistré', {
        tenantId,
        itemId,
        fromLocationId,
        toLocationId,
        quantity,
      });
    },
    { id: 'stock-transfer-handler', priority: 'HIGH' }
  );
}
