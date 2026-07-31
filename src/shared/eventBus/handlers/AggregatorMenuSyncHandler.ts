import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerAggregatorMenuSyncHandler() {
  return NexusEventBus.on(
    'integration.menu_sync_requested',
    async (payload) => {
      const { tenantId, integrationId, requestedBy } = payload;
      
      logger.info(`[AggregatorMenuSync] Export du catalogue menu vers l'intégration ${integrationId} (demandé par ${requestedBy}).`);

      // En réalité:
      // 1. Lire tout le catalogue de produits (src/domain/schemas/recipe.ts / products)
      // 2. Formater le JSON de sortie (Format UberEats vs Deliveroo)
      // 3. POST sur l'API partenaire

      empireAudit.log({
        module: 'ops',
        action: 'MENU_SYNC_PUSHED',
        details: { integrationId, requestedBy },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'aggregator-menu-sync', priority: 'BACKGROUND' }
  );
}
