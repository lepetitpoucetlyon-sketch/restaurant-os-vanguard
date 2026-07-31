import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerAntiCorruptionLayerHandler() {
  const unsubOrder = NexusEventBus.on(
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
          items: rawPayload.items?.map((i: any) => ({
            productId: i.external_data?.plu ?? i.id,
            name: i.title ?? i.name,
            quantity: i.quantity,
            unitPriceInMicrounits: (i.price_cents ?? 0) * 10_000,
            notes: i.special_instructions ?? '',
          })) ?? []
        });
        
        await NexusEventBus.emitDurable('order.paid', {
          v: 1,
          tenantId,
          orderId: canonicalOrderId,
          tableId: null,
          operatorId: `integration_${platform}`,
          items: rawPayload.items?.map((i: any) => ({
            productId: i.external_data?.plu ?? i.id,
            name: i.title ?? i.name,
            quantity: i.quantity,
            unitPriceInMicrounits: (i.price_cents ?? 0) * 10_000,
            notes: i.special_instructions ?? '',
          })) ?? [],
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

  const unsubResa = NexusEventBus.on(
    'integration.reservation_received',
    async (payload) => {
      const { tenantId, integrationId, platform, rawPayload } = payload as any;
      
      if (platform === 'lafourchette') {
        logger.info(`[ACL] Traduction de réservation LaFourchette vers l'Empire.`);
        
        await NexusEventBus.emitDurable('reservation.confirmed', {
          v: 1,
          tenantId,
          reservationId: `resa_${crypto.randomUUID()}`,
          customerName: rawPayload.customer_name || 'Inconnu',
          pax: rawPayload.pax || 2,
          date: rawPayload.date,
          time: rawPayload.time,
          channel: 'lafourchette',
        } as any);

        empireAudit.log({
          module: 'crm',
          action: 'ACL_LAFOURCHETTE_TRANSLATED',
          userId: 'system',
          instanceId: tenantId,
          details: { platform, rawPayload },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'acl-reservation', priority: 'HIGH' }
  );

  return () => {
    unsubOrder();
    if (unsubResa) unsubResa();
  };
}
