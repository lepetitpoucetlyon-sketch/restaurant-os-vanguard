import { addDays, addHours, isBefore, parseISO } from 'date-fns';
import { logger } from '@/lib/logger';

export interface LotItem {
  lotId: string;
  productId: string;
  primaryExpiryDateIso: string;
  unsealDateIso?: string;
  maxSecondaryHours?: number; // e.g. 24h for minced meat, 72h for sauces
}

export interface SecondaryDLCResult {
  secondaryExpiryDateIso: string;
  isExpired: boolean;
  ruleApplied: string;
}

/**
 * 🏷️ TraceabilityLotManager (Item 3.2)
 * Gestionnaire des lots de traçabilité et des DLC secondaires post-ouverture.
 * Calcule la DLC secondaire minimale légale selon le GBPH (Guide des Bonnes Pratiques d'Hygiène HCR).
 */
export class TraceabilityLotManager {
  static calculateSecondaryDLC(lot: LotItem): SecondaryDLCResult {
    const primaryDate = parseISO(lot.primaryExpiryDateIso);
    const unsealDate = lot.unsealDateIso ? parseISO(lot.unsealDateIso) : new Date();

    const maxHours = lot.maxSecondaryHours ?? 48; // 48h par défaut selon GBPH
    const secondaryCalculated = addHours(unsealDate, maxHours);

    // La DLC secondaire ne peut jamais dépasser la DLC primaire d'origine
    const effectiveSecondary = isBefore(primaryDate, secondaryCalculated)
      ? primaryDate
      : secondaryCalculated;

    const isExpired = isBefore(effectiveSecondary, new Date());

    logger.info(`[TraceabilityLotManager] Lot ${lot.lotId} -> DLC 2: ${effectiveSecondary.toISOString()} (Expiré: ${isExpired})`);

    return {
      secondaryExpiryDateIso: effectiveSecondary.toISOString(),
      isExpired,
      ruleApplied: `GBPH HCR: Min(Primaire, Ouverture + ${maxHours}h)`,
    };
  }
}
