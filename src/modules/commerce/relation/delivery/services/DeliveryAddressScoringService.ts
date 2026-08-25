import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface DeliveryAddressInput {
  addressLine: string;
  floor?: string;
  doorCode?: string;
  hasElevator?: boolean;
  historicalCourierFailureRate?: number; // 0.0 - 1.0
}

export interface AddressScoreResult {
  destinationAddress: string;
  reliabilityScore: number; // 0 - 100
  isAccessible: boolean;
  flagWarnings: string[];
}

/**
 * DeliveryAddressScoringService — Angle mort T47 (DF-M2).
 * Scoring de la complétude et de l'accessibilité de l'adresse de livraison.
 */
export class DeliveryAddressScoringService {
  static scoreAddress(tenantId: string, input: DeliveryAddressInput): AddressScoreResult {
    let score = 100;
    const warnings: string[] = [];

    if (!input.doorCode) {
      score -= 25;
      warnings.push('Digicode manquant');
    }

    if (input.floor && parseInt(input.floor, 10) >= 4 && !input.hasElevator) {
      score -= 20;
      warnings.push('Étage élevé sans ascenseur (>4e)');
    }

    if (input.historicalCourierFailureRate && input.historicalCourierFailureRate > 0.3) {
      score -= 30;
      warnings.push('Historique fort de livraisons échouées dans cette zone');
    }

    const reliabilityScore = Math.max(0, score);
    const minScore = getSetting<number>('pos', 'delivery_min_address_score', 50);
    const isAccessible = reliabilityScore >= minScore;

    NexusEventBus.emit('delivery.address_scored', {
      v: 1,
      tenantId,
      destinationAddress: input.addressLine,
      reliabilityScore,
      isAccessible,
      scoredAt: Date.now(),
    });

    return {
      destinationAddress: input.addressLine,
      reliabilityScore,
      isAccessible,
      flagWarnings: warnings,
    };
  }
}
