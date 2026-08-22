import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface SkuDeliveryCheck {
  deliverySlipId: string;
  supplierId: string;
  orderedSku: string;
  orderedName: string;
  deliveredSku: string;
  deliveredName: string;
  isSubstitutionAuthorized: boolean;
}

export interface SubstitutionAlertResult {
  hasUnauthorizedSubstitution: boolean;
  alertMessage?: string;
}

/**
 * SkuSubstitutionAlertService — Angle mort L30.
 * Détecte les substitutions sauvages de références livrées par les grossistes sans accord préalable (ex: beurre standard au lieu d'AOP Charentes-Poitou commandé).
 */
export class SkuSubstitutionAlertService {
  static verifyDeliveryItem(tenantId: string, check: SkuDeliveryCheck): SubstitutionAlertResult {
    const isDifferentSku = check.orderedSku !== check.deliveredSku;
    const hasUnauthorizedSubstitution = isDifferentSku && !check.isSubstitutionAuthorized;

    if (hasUnauthorizedSubstitution) {
      NexusEventBus.emit('stock.sku_substitution_alert', {
        v: 1,
        tenantId,
        supplierId: check.supplierId,
        orderedSku: check.orderedSku,
        deliveredSku: check.deliveredSku,
        varianceType: 'unauthorized_substitute',
        alertedAt: Date.now(),
      });

      return {
        hasUnauthorizedSubstitution: true,
        alertMessage: `🚨 SUBSTITUTION NON AUTORISÉE : ${check.deliveredName} (${check.deliveredSku}) livré à la place de ${check.orderedName} (${check.orderedSku}). Refus ou demande d'avoir conseillée.`,
      };
    }

    return {
      hasUnauthorizedSubstitution: false,
    };
  }
}
