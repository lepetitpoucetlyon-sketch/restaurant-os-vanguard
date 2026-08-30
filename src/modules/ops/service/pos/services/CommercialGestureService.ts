/**
 * L4 — Geste commercial "offert directeur".
 *
 * Quand un manager offre des verres ou un plat "maison", la suppression brute
 * de la ligne rend le coulage invisible. Solution :
 *  - La ligne reste dans l'ordre à 0 € (quantité × 0)
 *  - Un audit `COMMERCIAL_GESTURE` tracé avec motif + autorisateur
 *  - Pour l'alcool : mention obligatoire dans le registre traçabilité
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L4 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface CommercialGestureInput {
  tenantId: string;
  orderId: string;
  tableId: string;
  cartId: string;
  itemName: string;
  quantity: number;
  originalPriceInMicrounits: number;
  authorizedBy: string;
  reason: string;
  isAlcohol?: boolean;
  now?: number;
}

export class CommercialGestureService {
  static async applyGesture(input: CommercialGestureInput): Promise<void> {
    const now = input.now ?? Date.now();

    const order = await Nexus.adapter.get<Record<string, unknown>>(
      `tenants/${input.tenantId}/ops_flows/${input.orderId}`,
    );
    if (!order) throw new Error(`Commande ${input.orderId} introuvable`);

    const items = ((order.items as unknown[]) ?? []).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      if (i.cartId === input.cartId) {
        return {
          ...i,
          unitPriceInMicrounits: 0,
          discountInMicrounits: input.originalPriceInMicrounits,
          gestureReason: input.reason,
          gestureBy: input.authorizedBy,
          gestureAt: now,
        };
      }
      return i;
    });

    await Nexus.adapter.set(`tenants/${input.tenantId}/ops_flows/${input.orderId}`, { ...order, items });

    const gestureRecord = {
      id: `gesture_${input.orderId}_${input.cartId}_${now}`,
      tenantId: input.tenantId,
      orderId: input.orderId,
      tableId: input.tableId,
      cartId: input.cartId,
      itemName: input.itemName,
      quantity: input.quantity,
      amountInMicrounits: input.originalPriceInMicrounits,
      authorizedBy: input.authorizedBy,
      reason: input.reason,
      isAlcohol: input.isAlcohol ?? false,
      recordedAt: now,
    };

    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/commercial_gestures`,
      targetId: gestureRecord.id,
      priority: OutboxPriority.FISCAL,
      payload: gestureRecord as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.authorizedBy,
      'COMMERCIAL_GESTURE',
      input.orderId,
      { cartId: input.cartId, itemName: input.itemName, amountInMicrounits: input.originalPriceInMicrounits, isAlcohol: input.isAlcohol, reason: input.reason },
    ).catch(() => null);

    await NexusEventBus.emit('ops.commercial_gesture_offered', {
      v: 1,
      tenantId: input.tenantId,
      orderId: input.orderId,
      tableId: input.tableId,
      itemName: input.itemName,
      amountInMicrounits: input.originalPriceInMicrounits,
      authorizedBy: input.authorizedBy,
      reason: input.reason,
      offeredAt: now,
    });
  }
}
