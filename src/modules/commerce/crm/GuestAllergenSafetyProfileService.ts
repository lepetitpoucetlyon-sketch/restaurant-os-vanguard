import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface GuestProfile {
  customerId: string;
  fullName: string;
  criticalAllergens: string[]; // ex: ['arachides', 'crustaces', 'gluten']
  medicalNotes?: string;
}

export interface OrderedDishAllergenCheck {
  orderId: string;
  dishName: string;
  dishAllergens: string[];
}

export interface AllergenSafetyReport {
  hasConflict: boolean;
  conflictingAllergens: string[];
  alertMessage?: string;
}

/**
 * GuestAllergenSafetyProfileService — Angle mort L76.
 * Profil allergène invité mémorisé & pop-up de blocage POS lors de la commande si le plat sélectionné contient un allergène critique du client.
 */
export class GuestAllergenSafetyProfileService {
  static verifyOrderSafety(
    tenantId: string,
    guest: GuestProfile,
    dish: OrderedDishAllergenCheck
  ): AllergenSafetyReport {
    const conflicting = dish.dishAllergens.filter(a =>
      guest.criticalAllergens.map(g => g.toLowerCase()).includes(a.toLowerCase())
    );

    const hasConflict = conflicting.length > 0;

    if (hasConflict) {
      NexusEventBus.emit('crm.guest_allergen_alerted', {
        v: 1,
        tenantId,
        customerId: guest.customerId,
        orderId: dish.orderId,
        conflictingAllergens: conflicting,
        alertedAt: Date.now(),
      });

      return {
        hasConflict: true,
        conflictingAllergens: conflicting,
        alertMessage: `🚨 DANGER ALLERGÈNE : ${guest.fullName} est allergique à [${conflicting.join(', ')}] présent dans "${dish.dishName}". Validation manager requise.`,
      };
    }

    return {
      hasConflict: false,
      conflictingAllergens: [],
    };
  }
}
