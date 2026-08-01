import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerRushModeIntegrationHandler() {
  return NexusEventBus.on(
    'store.rush_mode_toggled',
    async (payload) => {
      const { tenantId, isPaused } = payload;
      
      logger.info(`[RushMode] Rush mode ${isPaused ? 'ACTIVÉ' : 'DÉSACTIVÉ'} pour le store ${tenantId}`);
      
      if (isPaused) {
        logger.warn(`[RushMode] Pause des plateformes de livraison externes (UberEats, Deliveroo...)`);
        
        // Simuler la pause sur les intégrations
        // await DeliveryIntegration.pauseAll(tenantId);
        
        empireAudit.log({
          module: 'ops',
          action: 'EXTERNAL_ORDERS_PAUSED',
          details: { reason: 'rush_mode_activated' },
          severity: 'medium',
          timestamp: new Date(),
        });
        
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: 'Mode RUSH activé. Commandes en ligne suspendues pour désengorger la cuisine.',
          roles: ['manager', 'admin'],
          priority: 'HIGH',
        });
      } else {
        logger.info(`[RushMode] Réactivation des plateformes de livraison externes`);
        // await DeliveryIntegration.resumeAll(tenantId);
        
        empireAudit.log({
          module: 'ops',
          action: 'EXTERNAL_ORDERS_RESUMED',
          details: { reason: 'rush_mode_deactivated' },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'rush-mode-integration-handler', priority: 'HIGH' }
  );
}
