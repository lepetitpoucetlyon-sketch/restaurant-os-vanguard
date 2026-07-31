import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerAntiCorruptionLayerHandler() {
  return NexusEventBus.on(
    'integration.delivery_order_received',
    async (payload) => {
      const { tenantId, integrationId, platform, rawPayload } = payload;
      
      const config = await Nexus.adapter.get<any>(`tenants/${tenantId}/integrations/${integrationId}`);
      
      if (config && config.autoAccept) {
        logger.info(`[ACL] Auto-Accept activé pour ${platform}. Traduction du payload brut vers les événements natifs de l'Empire.`);
        
        const canonicalOrderId = `order_${crypto.randomUUID()}`;
        const amount = rawPayload.total_price_cents * 100 || 0; 
        
        await NexusEventBus.emitDurable('order.placed', {
          v: 1,
          tenantId,
          orderId: canonicalOrderId,
          tableId: null,
          operatorId: `integration_${platform}`,
          items: [] 
        });
        
        await NexusEventBus.emitDurable('order.paid', {
          v: 1,
          tenantId,
          orderId: canonicalOrderId,
          tableId: null,
          operatorId: `integration_${platform}`,
          items: [],
          totalInMicrounits: amount,
          paymentMode: platform
        });

        empireAudit.log({
          module: 'ops',
          action: 'ACL_AUTO_ACCEPT_TRANSLATED',
          details: { canonicalOrderId, platform },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'anti-corruption-layer', priority: 'HIGH' }
  );
}
