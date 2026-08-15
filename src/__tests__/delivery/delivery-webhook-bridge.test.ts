import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeliveryWebhookBridge, type ExternalDeliveryPayload } from '@/modules/commerce/connectors/delivery/DeliveryWebhookBridge';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('Hub Connecteurs Livraison : Webhook Bridge (UberEats / Deliveroo)', () => {
  const tenantId = 'pizzeria-napoli';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait ingérer une commande UberEats et l enregistrer dans le circuit KDS / Caisses', async () => {
    const orderPlacedSpy = vi.fn();
    NexusEventBus.on('order.placed', orderPlacedSpy, { id: 'test-delivery-order' });

    const rawUberPayload: ExternalDeliveryPayload = {
      externalOrderId: 'UBER-998822',
      customer: {
        name: 'Alexandre Dumas',
        phone: '+33612345678',
      },
      deliveryNotes: 'Sonner à l interphone B2',
      totalAmountInCents: 3400, // 34.00 €
      items: [
        {
          id: 'prod-pizza-margherita',
          name: 'Pizza Margherita DOC',
          quantity: 2,
          priceInCents: 1700,
          specialInstructions: 'Sans basilic',
        },
      ],
    };

    const normalized = await DeliveryWebhookBridge.processIncomingDeliveryOrder(
      tenantId,
      'ubereats',
      rawUberPayload
    );

    expect(normalized.orderId).toBe('ord_deliv_ubereats_UBER-998822');
    expect(normalized.channel).toBe('DELIVERY');
    expect(normalized.totalInMicrounits).toBe(34000000);
    expect(normalized.items.length).toBe(1);
    expect(normalized.items[0].notes).toBe('Sans basilic');

    expect(orderPlacedSpy).toHaveBeenCalledTimes(1);

    // Vérification de la persistance Nexus
    const savedOrder = await Nexus.adapter.get<{ id: string; channel: string }>(
      `tenants/${tenantId}/orders/${normalized.orderId}`
    );
    expect(savedOrder).not.toBeNull();
    expect(savedOrder?.id).toBe(normalized.orderId);
  });
});
