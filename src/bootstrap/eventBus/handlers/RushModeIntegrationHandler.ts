import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerRushModeIntegrationHandler() {
  return NexusEventBus.on(
    'store.rush_mode_toggled',
    async (payload) => {
      const { tenantId, isPaused } = payload;
      
      logger.info(`[RushMode] Rush mode ${isPaused ? 'ACTIVÉ (Pause)' : 'DÉSACTIVÉ (Reprise)'} pour le store ${tenantId}`);
      
      // ── Item R11: Synchronisation réelle des statuts d'agrégateurs (UberEats, Deliveroo, Deliverect)
      const platforms = ['ubereats', 'deliveroo', 'justeat', 'deliverect'];
      await Promise.all(
        platforms.map(platform =>
          Nexus.adapter.update(`tenants/${tenantId}/deliveryIntegrations/${platform}`, {
            platform,
            isPaused,
            updatedAt: new Date().toISOString(),
            status: isPaused ? 'paused_rush_mode' : 'active',
          })
        )
      );

      if (isPaused) {
        logger.warn(`[RushMode] Pause effective des 4 plateformes de livraison externes pour ${tenantId}`);
        
        empireAudit.log({
          module: 'ops',
          action: 'EXTERNAL_ORDERS_PAUSED',
          details: { reason: 'rush_mode_activated', platforms },
          severity: 'medium',
          timestamp: new Date(),
        });
        
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: 'Mode RUSH activé. Commandes en ligne suspendues sur UberEats & Deliveroo pour désengorger la cuisine.',
          roles: ['manager', 'admin'],
          priority: 'HIGH',
        });
      } else {
        logger.info(`[RushMode] Réactivation effective des 4 plateformes de livraison externes pour ${tenantId}`);
        
        empireAudit.log({
          module: 'ops',
          action: 'EXTERNAL_ORDERS_RESUMED',
          details: { reason: 'rush_mode_deactivated', platforms },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'rush-mode-integration-handler', priority: 'HIGH' }
  );
}
