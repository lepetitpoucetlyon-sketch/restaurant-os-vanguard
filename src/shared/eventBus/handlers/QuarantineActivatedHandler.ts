/* eslint-disable no-restricted-imports -- tolerated structural inversion */
import { NexusEventBus } from '../NexusEventBus';
import { ProductAvailabilityService } from '@/modules/logistics/stock/services/ProductAvailabilityService';

export function registerQuarantineActivatedHandler() {
  return NexusEventBus.on(
    'inventory.quarantine_activated',
    async (payload) => {
      const { productIds, tenantId, reason } = payload;
      
      // 1. Marquer chaque produit quarantainé comme non-disponible
      for (const productId of productIds) {
        await ProductAvailabilityService.flagUnavailable(
          tenantId,
          productId,
          `HACCP Quarantine: ${reason || 'Non spécifiée'}`
        );
      }
      
      // 2. Émettre notification urgente managers
      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId,
        message: `⚠️ ${productIds.length} produit(s) mis en quarantaine HACCP. Raison : ${reason || 'Non spécifiée'}`,
        roles: ['manager', 'chef_cuisinier'],
        priority: 'CRITICAL',
      });
    },
    { id: 'quarantine-activated-handler', priority: 'CRITICAL' }
  );
}
