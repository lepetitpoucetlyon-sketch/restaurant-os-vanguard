/**
 * M110 — Late allergen change post-KDS
 *
 * Un client rappelle 15 min avant son arrivée pour signaler une allergie mortelle
 * aux arachides. Sa commande est déjà en cuisson. Il faut :
 *  1. Émettre `kds.critical_allergen_interception` sur le bus (Flash Buzzer DLQ Alarm)
 *  2. Enfiler l'alerte via OutboxService en priorité SANITAIRE (drainé avant metrics)
 *  3. Auditer l'action via AuditLogger (ALLERGEN_ORDER_BLOCKED) — chaîne SHA-256
 *  4. Suggérer les items impactés à re-préparer (calcul pur, hors IO)
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M110.
 * RBAC : `kds.override_allergen` (Manager + PIN) — déjà présent dans actionPermissionMap.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface KdsItemSnapshot {
  id: string;
  productId: string;
  name: string;
  allergens: string[];
  /** État à l'instant du signalement : cooking, plated, served. */
  status: 'queued' | 'cooking' | 'plated' | 'served';
}

export interface LateAllergenInput {
  tenantId: string;
  orderId: string;
  operatorId: string;
  newAllergens: string[];
  items: KdsItemSnapshot[];
  guestName?: string;
  changedAt: number;
  reservationTimeMs: number;
}

export interface InterceptionResult {
  intercepted: boolean;
  impactedItemIds: string[];
  reason?: 'NO_MATCH' | 'ALL_SERVED';
  minutesBeforeArrival: number;
}

export class LateAllergenInterceptionService {
  /**
   * Calcule les items impactés + niveau d'action. Pur, testable.
   * Un item déjà `served` reste tracé mais ne peut pas être ré-intercepté cuisine.
   */
  static computeImpact(input: LateAllergenInput): InterceptionResult {
    const minutesBeforeArrival = Math.max(
      0,
      Math.round((input.reservationTimeMs - input.changedAt) / 60000),
    );

    const impactedItems = input.items.filter(item =>
      item.allergens.some(a => input.newAllergens.includes(a.toLowerCase())),
    );

    if (impactedItems.length === 0) {
      return {
        intercepted: false,
        impactedItemIds: [],
        reason: 'NO_MATCH',
        minutesBeforeArrival,
      };
    }

    const interceptable = impactedItems.filter(i => i.status !== 'served');
    if (interceptable.length === 0) {
      return {
        intercepted: false,
        impactedItemIds: impactedItems.map(i => i.id),
        reason: 'ALL_SERVED',
        minutesBeforeArrival,
      };
    }

    return {
      intercepted: true,
      impactedItemIds: interceptable.map(i => i.id),
      minutesBeforeArrival,
    };
  }

  /** Compute + émet event + outbox sanitaire + audit. */
  static async intercept(input: LateAllergenInput): Promise<InterceptionResult> {
    const result = this.computeImpact(input);
    if (!result.intercepted) return result;

    await NexusEventBus.emit('kds.critical_allergen_interception', {
      v: 1,
      tenantId: input.tenantId,
      orderId: input.orderId,
      itemIds: result.impactedItemIds,
      allergens: input.newAllergens,
      guestName: input.guestName,
      changedAt: input.changedAt,
      minutesBeforeArrival: result.minutesBeforeArrival,
    });

    // Outbox tier SANITAIRE — assure la remontée même en cas de coupure réseau caisse.
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/haccp_incidents`,
      targetId: `allergen_${input.orderId}_${input.changedAt}`,
      priority: OutboxPriority.SANITAIRE,
      payload: {
        kind: 'LATE_ALLERGEN_INTERCEPTION',
        orderId: input.orderId,
        allergens: input.newAllergens,
        impactedItemIds: result.impactedItemIds,
        guestName: input.guestName,
        changedAt: input.changedAt,
      },
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.operatorId,
      'ALLERGEN_ORDER_BLOCKED',
      input.orderId,
      {
        allergens: input.newAllergens,
        impactedItemIds: result.impactedItemIds,
        minutesBeforeArrival: result.minutesBeforeArrival,
      },
    ).catch(() => null);

    return result;
  }
}
