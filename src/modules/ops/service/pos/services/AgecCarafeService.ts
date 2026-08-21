/**
 * L8 — Carafe d'eau gratuite AGEC (Loi Anti-Gaspillage pour une Économie Circulaire).
 *
 * Art. L. 229-61 Code de l'Environnement (issu loi AGEC 2020) :
 * depuis le 1er janvier 2022, tout restaurant doit proposer gratuitement
 * de l'eau potable aux clients qui consomment sur place — y compris de
 * l'eau non embouteillée. Refuser = 150 € d'amende.
 *
 * Ce service attache automatiquement une ligne "Carafe d'eau (offerte)"
 * à 0 µ dès que le comptage de couverts est confirmé en salle.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L8.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface AgecCarafeLine {
  cartId: string;
  productId: 'AGEC_CARAFE_EAU';
  name: 'Carafe d\'eau (offerte AGEC)';
  quantity: number;
  unitPriceInMicrounits: 0;
  legalRef: 'Art. L. 229-61 C.Env.';
  attachedAt: number;
}

export class AgecCarafeService {
  static buildLine(couverts: number, now?: number): AgecCarafeLine {
    const quantity = Math.max(1, Math.ceil(couverts / 4));
    return {
      cartId: `agec_${Date.now()}`,
      productId: 'AGEC_CARAFE_EAU',
      name: 'Carafe d\'eau (offerte AGEC)',
      quantity,
      unitPriceInMicrounits: 0,
      legalRef: 'Art. L. 229-61 C.Env.',
      attachedAt: now ?? Date.now(),
    };
  }

  static async attachToOrder(input: {
    tenantId: string;
    orderId: string;
    couverts: number;
    operatorId: string;
    now?: number;
  }): Promise<AgecCarafeLine> {
    const now = input.now ?? Date.now();
    const line = this.buildLine(input.couverts, now);

    await Nexus.adapter.set(
      `tenants/${input.tenantId}/orders/${input.orderId}/agec_carafe`,
      { ...line, orderId: input.orderId, attachedBy: input.operatorId },
    );

    await NexusEventBus.emit('ops.agec_carafe_attached', {
      v: 1,
      tenantId: input.tenantId,
      orderId: input.orderId,
      couverts: input.couverts,
      quantity: line.quantity,
      attachedAt: now,
    }).catch(() => null);

    return line;
  }
}
