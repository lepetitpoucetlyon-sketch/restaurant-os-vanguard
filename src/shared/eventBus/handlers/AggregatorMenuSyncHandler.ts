/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';
import { AggregatorMappingService } from '@/modules/commerce/relation/delivery/services/AggregatorMappingService';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export function registerAggregatorMenuSyncHandler() {
  return NexusEventBus.on(
    'integration.menu_sync_requested',
    async (payload) => {
      const { tenantId, integrationId, requestedBy } = payload;
      
      logger.info(`[AggregatorMenuSync] Export du catalogue menu vers l'intégration ${integrationId} (demandé par ${requestedBy}).`);

      // 1. Lire les intégrations actives pour filtrer sur l'integrationId cible
      const activeIntegrations = await AggregatorMappingService.getActiveAdapters(tenantId);
      const targetIntegration = activeIntegrations.find(i => i.adapter.platformId === integrationId);

      if (!targetIntegration) {
          logger.warn(`[AggregatorMenuSync] Intégration ${integrationId} non trouvée ou inactive pour le tenant ${tenantId}.`);
          return;
      }

      // 2. Fetch du catalogue (mock)
      const recipes = await Nexus.adapter.query(`tenants/${tenantId}/recipes`);
      const payloadData = { recipes, mappings: targetIntegration.mappings };

      // 3. Pousser le catalogue vers l'API de l'agrégateur
      const success = await targetIntegration.adapter.pushMenu(tenantId, payloadData);

      empireAudit.log({
        module: 'ops',
        action: 'MENU_SYNC_PUSHED',
        details: { integrationId, requestedBy, success },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'aggregator-menu-sync', priority: 'BACKGROUND' }
  );
}
