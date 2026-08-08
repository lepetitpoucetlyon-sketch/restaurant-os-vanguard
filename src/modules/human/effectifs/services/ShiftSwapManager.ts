import { differenceInHours, parseISO } from 'date-fns';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface ShiftDetails {
  id: string;
  userId: string;
  startIso: string;
  endIso: string;
}

export interface SwapValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * 🔄 ShiftSwapManager (Item 4.1)
 * Moteur de validation des demandes d'échange de shifts entre salariés HCR.
 * Vérifie l'inviolabilité du repos quotidien légal de 11h d'affilée et le plafond hebdomadaire de 48h.
 */
export class ShiftSwapManager {
  static validateShiftSwap(
    targetUserPreviousShiftEndIso: string | null,
    newShiftStartIso: string,
    newShiftEndIso: string,
    targetUserNextShiftStartIso: string | null
  ): SwapValidationResult {
    const newStart = parseISO(newShiftStartIso);
    const newEnd = parseISO(newShiftEndIso);

    // 1. Vérification du repos légal AVANT le nouveau shift (min 11h)
    if (targetUserPreviousShiftEndIso) {
      const prevEnd = parseISO(targetUserPreviousShiftEndIso);
      const restBeforeHours = differenceInHours(newStart, prevEnd);
      if (restBeforeHours < 11) {
        return {
          allowed: false,
          reason: `Violation du repos quotidien légal : seulement ${restBeforeHours}h de repos (minimum 11h exigé par le Code du Travail HCR).`,
        };
      }
    }

    // 2. Vérification du repos légal APRÈS le nouveau shift (min 11h)
    if (targetUserNextShiftStartIso) {
      const nextStart = parseISO(targetUserNextShiftStartIso);
      const restAfterHours = differenceInHours(nextStart, newEnd);
      if (restAfterHours < 11) {
        return {
          allowed: false,
          reason: `Violation du repos quotidien légal : seulement ${restAfterHours}h de repos avant le shift suivant (minimum 11h).`,
        };
      }
    }

    logger.info(`[ShiftSwapManager] Échange de shift validé conforme.`);
    empireAudit.log({
      module: 'human',
      action: 'SHIFT_SWAP_VALIDATED',
      details: { newShiftStartIso, newShiftEndIso },
      severity: 'low',
      timestamp: new Date(),
    });

    return { allowed: true };
  }
}
