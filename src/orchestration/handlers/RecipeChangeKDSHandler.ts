import { NexusEventBus } from '../NexusEventBus';
import { SharedKernel } from '@/lib/shared-kernel';

export function registerRecipeChangeKDSHandler() {
  return NexusEventBus.on(
    'recipe.updated',
    async (payload) => {
      const { tenantId, recipeId: _recipeId, productId } = payload;
      
      // Invalider le cache KDS pour ce produit
      // Émettre un événement pour forcer le rafraîchissement des KDS
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId,
        id: SharedKernel.generateId('notif'),
        type: 'warning',
        title: 'Recette mise à jour',
        message: `La recette du produit ${productId} a changé. Vérifiez les nouvelles instructions.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
      });
    },
    { id: 'recipe-change-kds-handler', priority: 'HIGH' }
  );
}
