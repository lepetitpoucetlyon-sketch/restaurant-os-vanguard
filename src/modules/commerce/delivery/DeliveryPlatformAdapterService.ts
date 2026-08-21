import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type DeliveryPlatform = 'uber_eats' | 'deliveroo' | 'just_eat';

export interface ExternalPlatformOrder {
  platform: DeliveryPlatform;
  platformOrderId: string;
  customerName: string;
  orderLines: {
    sku: string;
    name: string;
    qty: number;
    unitPriceInMicrounits: number;
    instructions?: string;
  }[];
  platformCommissionInMicrounits: number;
  deliveryCourierInfo?: {
    courierName: string;
    vehicleType: string;
  };
}

export interface UniversalPosOrder {
  posOrderId: string;
  source: string;
  channel: 'delivery';
  customerName: string;
  totalInMicrounits: number;
  linesCount: number;
  normalizedAt: number;
}

/**
 * DeliveryPlatformAdapterService — Angle mort F1.
 * Normalise les commandes entrantes des agrégateurs (Uber Eats, Deliveroo, Just Eat) vers le format canonique POS / KDS.
 */
export class DeliveryPlatformAdapterService {
  static normalizeOrder(tenantId: string, ext: ExternalPlatformOrder): UniversalPosOrder {
    const posOrderId = `POS-DELIV-${ext.platform.toUpperCase()}-${ext.platformOrderId}`;
    const totalInMicrounits = ext.orderLines.reduce((sum, l) => sum + (l.qty * l.unitPriceInMicrounits), 0);

    NexusEventBus.emit('delivery.order_normalized', {
      v: 1,
      tenantId,
      platform: ext.platform,
      platformOrderId: ext.platformOrderId,
      posOrderId,
      totalInMicrounits,
      normalizedAt: Date.now(),
    });

    return {
      posOrderId,
      source: ext.platform,
      channel: 'delivery',
      customerName: ext.customerName,
      totalInMicrounits,
      linesCount: ext.orderLines.length,
      normalizedAt: Date.now(),
    };
  }
}
