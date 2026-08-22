import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface VipGuestPreferences {
  customerId: string;
  guestName: string;
  preferredTableNumber: string;
  favoriteWater: 'plate' | 'gazeuse_chateldon' | 'san_pellegrino';
  meatCookingPreference: 'bleu' | 'saignant';
  dietaryRestrictions: string[];
  notes: string;
}

export interface VipWelcomeGreeting {
  customerId: string;
  greetingSummary: string;
  vipTableAssignment: string;
  appliedAt: number;
}

/**
 * VipGuestPreferenceMemoryService — Angle mort T74.
 * Mémoire intelligente des préférences clients VIP :
 * Notification instantanée au maître d'hôtel lors de la réservation ou de l'arrivée (table préférée, bouteille favorite servie d'office).
 */
export class VipGuestPreferenceMemoryService {
  static async applyPreferences(
    tenantId: string,
    adminId: string,
    prefs: VipGuestPreferences
  ): Promise<VipWelcomeGreeting> {
    const greetingSummary = `Accueillir ${prefs.guestName} : Table ${prefs.preferredTableNumber}, servir eau ${prefs.favoriteWater} dès l'assise.`;

    NexusEventBus.emit('crm.vip_preference_applied', {
      v: 1,
      tenantId,
      customerId: prefs.customerId,
      preferenceSummary: greetingSummary,
      appliedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'VIP_PREFERENCE_UPDATED',
      targetId: prefs.customerId,
      ipAddress: '127.0.0.1',
      metadata: {
        preferredTable: prefs.preferredTableNumber,
        water: prefs.favoriteWater,
      },
    });

    return {
      customerId: prefs.customerId,
      greetingSummary,
      vipTableAssignment: prefs.preferredTableNumber,
      appliedAt: Date.now(),
    };
  }
}
