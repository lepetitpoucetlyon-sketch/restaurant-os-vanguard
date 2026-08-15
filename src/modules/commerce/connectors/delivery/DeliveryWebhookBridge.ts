import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { KDSCourseSequencingEngine } from '@/modules/ops/production/kds/services/KDSCourseSequencingEngine';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/modules/ops/workflow/engine/types';
import { toMicrounits } from '@/shared/schemas/primitives';

export type DeliveryProvider = 'ubereats' | 'deliveroo' | 'justeat';

export interface ExternalDeliveryPayload {
  externalOrderId: string;
  customer: {
    name: string;
    phone?: string;
  };
  deliveryNotes?: string;
  pickupEstimatedAt?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    priceInCents: number;
    specialInstructions?: string;
  }>;
  totalAmountInCents: number;
}

export interface NormalizedDeliveryOrder {
  orderId: string;
  externalOrderId: string;
  provider: DeliveryProvider;
  tenantId: string;
  customerName: string;
  items: CartItem[];
  totalInMicrounits: number;
  channel: 'DELIVERY';
  status: 'pending';
  deliveryNotes?: string;
  createdAt: number;
}

/**
 * 🛵 DeliveryWebhookBridge — Hub Connecteurs Livraison
 * Ingestion unifiée des commandes UberEats / Deliveroo directement vers le KDS et la caisse.
 */
export class DeliveryWebhookBridge {
  /**
   * Normalise et enregistre une commande issue d'une plateforme de livraison externe.
   */
  static async processIncomingDeliveryOrder(
    tenantId: string,
    provider: DeliveryProvider,
    payload: ExternalDeliveryPayload
  ): Promise<NormalizedDeliveryOrder> {
    const orderId = `ord_deliv_${provider}_${payload.externalOrderId}`;
    const now = Date.now();

    const cartItems: CartItem[] = payload.items.map((it, idx) => ({
      cartId: `cart_${orderId}_${idx}`,
      productId: it.id,
      categoryId: 'cat-delivery-default',
      name: it.name,
      quantity: it.quantity,
      unitPriceInMicrounits: toMicrounits(it.priceInCents * 10000),
      taxRate: '0.10' as const,
      discountInMicrounits: toMicrounits(0),
      modifiers: [],
      course: 'plat',
      notes: it.specialInstructions,
    }));

    const totalInMicrounits = payload.totalAmountInCents * 10000;

    const normalizedOrder: NormalizedDeliveryOrder = {
      orderId,
      externalOrderId: payload.externalOrderId,
      provider,
      tenantId,
      customerName: payload.customer.name,
      items: cartItems,
      totalInMicrounits,
      channel: 'DELIVERY',
      status: 'pending',
      deliveryNotes: payload.deliveryNotes,
      createdAt: now,
    };

    // 1. Persistance canonique
    await Nexus.adapter.set(`tenants/${tenantId}/orders/${orderId}`, {
      ...normalizedOrder,
      id: orderId,
      totalInCents: payload.totalAmountInCents,
      timestamp: now,
    });

    // 2. Initialisation cadençage KDS cuisine
    await KDSCourseSequencingEngine.initializeOrderCourses(
      tenantId,
      orderId,
      undefined,
      cartItems
    );

    // 3. Émission des événements du bus
    await NexusEventBus.emit('order.placed', {
      v: 1,
      orderId,
      tableId: null,
      tenantId,
      operatorId: `connector-${provider}`,
      items: cartItems,
    });

    empireAudit.log({
      module: 'commerce',
      action: 'DELIVERY_ORDER_INGESTED',
      details: {
        orderId,
        externalOrderId: payload.externalOrderId,
        provider,
        totalInMicrounits,
      },
      severity: 'low',
      timestamp: new Date(now),
    });

    logger.info(`[DeliveryBridge] Commande ${provider.toUpperCase()} ingérée : ${orderId} (${payload.customer.name})`);
    return normalizedOrder;
  }
}
