import { NexusEventBus } from '../NexusEventBus';
import { ProductAvailabilityService } from '@/domain/services/ProductAvailabilityService';

export function registerRecallPOSBlockerHandler() {
  return NexusEventBus.on(
    'recall.declared',
    async (payload) => {
      const { productIds, tenantId, reason } = payload;
      
      // Bloquer les produits immédiatement
      for (const productId of productIds) {
        await ProductAvailabilityService.flagUnavailable(
          tenantId,
          productId,
          `RAPPEL SANITAIRE: ${reason || 'Non spécifiée'}`
        );
      }
      
      // Notification urgente tous rôles
      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId,
        message: `🚨 RAPPEL PRODUIT — Retirer immédiatement du POS. Produits concernés: ${productIds.join(', ')}`,
        roles: ['manager', 'chef_cuisinier', 'serveur'],
        priority: 'CRITICAL',
      });
    },
    { id: 'recall-pos-blocker-handler', priority: 'CRITICAL' }
  );
}
