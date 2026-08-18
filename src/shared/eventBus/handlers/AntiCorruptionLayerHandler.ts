import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { JsonObject } from "@/shared/types/json";

interface IntegrationConfig {
  autoAccept?: boolean;
}

interface RawDeliveryItem {
  id?: string;
  plu?: string;
  name?: string;
  title?: string;
  quantity: number;
  price_cents?: number;
  special_instructions?: string;
  external_data?: { plu?: string };
}

interface ReservationPayload {
  tenantId: string;
  integrationId: string;
  platform: string;
  rawPayload: {
    customer_name?: string;
    pax?: number;
    date?: string;
    time?: string;
  };
}

export function registerAntiCorruptionLayerHandler() {
  const unsubOrder = NexusEventBus.on(
    'integration.delivery_order_received',
    async (payload) => {
      const { tenantId, integrationId, platform, rawPayload } = payload;
      
      const config = await Nexus.adapter.get<IntegrationConfig>(`tenants/${tenantId}/integrations/${integrationId}`);
      
      if (config && config.autoAccept) {
        logger.info(`[ACL] Auto-Accept activé pour ${platform}. Traduction du payload brut vers les événements natifs de l'Empire.`);
        
        const canonicalOrderId = `order_${crypto.randomUUID()}`;
        const rp = rawPayload as JsonObject;
        const amount = (rp.total_price_cents as number) * 100 || 0; 
        
        await NexusEventBus.emitDurable('order.placed', {
          v: 1,
          tenantId,
          orderId: canonicalOrderId,
          tableId: null,
          operatorId: `integration_${platform}`,
          items: (rp.items as unknown as RawDeliveryItem[])?.map((i: RawDeliveryItem) => ({
            productId: i.external_data?.plu ?? i.id,
            name: i.title ?? i.name,
            quantity: i.quantity,
            unitPriceInMicrounits: (i.price_cents ?? 0) * 10_000,
            notes: i.special_instructions ?? '',
          })) as unknown as import('@/modules/ops/domain/schemas/pos').CartItem[] ?? []
        });
        
        await NexusEventBus.emitDurable('order.paid', {
          v: 1,
          tenantId,
          orderId: canonicalOrderId,
          tableId: null,
          operatorId: `integration_${platform}`,
          items: (rp.items as unknown as RawDeliveryItem[])?.map((i: RawDeliveryItem) => ({
            productId: i.external_data?.plu ?? i.id,
            name: i.title ?? i.name,
            quantity: i.quantity,
            unitPriceInMicrounits: (i.price_cents ?? 0) * 10_000,
            notes: i.special_instructions ?? '',
          })) as unknown as import('@/modules/ops/domain/schemas/pos').CartItem[] ?? [],
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
      const { tenantId, integrationId, platform, rawPayload } = payload as ReservationPayload;
      
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
        } as Parameters<typeof NexusEventBus.emitDurable>[1]);

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
