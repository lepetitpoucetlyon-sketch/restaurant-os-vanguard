/**
 * B4 / T48 — Blocage commande si allergène détecté (gate POS + delivery).
 *
 * Règlement INCO 1169/2011 (Union Européenne) : tout opérateur alimentaire doit
 * être en mesure de fournir l'information sur les 14 allergènes majeurs avant
 * la vente. Un serveur qui valide une commande "vegan" contenant du beurre
 * engage la responsabilité civile et pénale de l'établissement.
 *
 * Ce service :
 *  1. `check(guestAllergens, cartItems)` — pure, testable, sans IO
 *  2. `blockOrWarn(input)` — effectue l'audit + event + refuse si `forceBlock=true`
 *
 * Cf. docs/anglemort-restaurant-mcc.md § B4 + T48 (CRITIQUE — INCO 1169/2011).
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface AllergenCartItem {
  cartId: string;
  productId: string;
  name: string;
  allergens: string[];
}

export interface AllergenCheckResult {
  blocked: boolean;
  matchedItems: Array<{ cartId: string; name: string; matchingAllergens: string[] }>;
}

export class AllergenGateService {
  static check(guestAllergens: string[], cartItems: AllergenCartItem[]): AllergenCheckResult {
    if (!guestAllergens.length) return { blocked: false, matchedItems: [] };

    const guestSet = new Set(guestAllergens.map(a => a.toLowerCase()));
    const matched: AllergenCheckResult['matchedItems'] = [];

    for (const item of cartItems) {
      const hits = item.allergens.filter(a => guestSet.has(a.toLowerCase()));
      if (hits.length) {
        matched.push({ cartId: item.cartId, name: item.name, matchingAllergens: hits });
      }
    }

    return { blocked: matched.length > 0, matchedItems: matched };
  }

  static async blockOrWarn(input: {
    tenantId: string;
    orderId: string;
    operatorId: string;
    guestAllergens: string[];
    cartItems: AllergenCartItem[];
    forceBlock?: boolean;
    now?: number;
  }): Promise<AllergenCheckResult> {
    const now = input.now ?? Date.now();
    const result = this.check(input.guestAllergens, input.cartItems);

    if (!result.blocked) return result;

    const matchedItemIds = result.matchedItems.map(i => i.cartId);

    await AuditLogger.logAction(
      input.operatorId,
      'ALLERGEN_ORDER_BLOCKED',
      input.orderId,
      {
        guestAllergens: input.guestAllergens,
        matchedItems: result.matchedItems,
        forceBlock: input.forceBlock ?? true,
      },
    ).catch(() => null);

    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/allergen_blocks`,
      targetId: `block_${input.orderId}_${now}`,
      priority: OutboxPriority.SANITAIRE,
      payload: {
        orderId: input.orderId,
        guestAllergens: input.guestAllergens,
        matchedItems: result.matchedItems,
        blockedAt: now,
      },
    }).catch(() => 0);

    await NexusEventBus.emit('ops.allergen_order_blocked', {
      v: 1,
      tenantId: input.tenantId,
      orderId: input.orderId,
      guestAllergens: input.guestAllergens,
      matchedItems: matchedItemIds,
      blockedAt: now,
    });

    if (input.forceBlock !== false) {
      throw new Error(
        `ALLERGEN_GATE_BLOCKED: commande refusée — allergènes détectés: ${input.guestAllergens.join(', ')} dans [${result.matchedItems.map(i => i.name).join(', ')}]`,
      );
    }

    return result;
  }
}
