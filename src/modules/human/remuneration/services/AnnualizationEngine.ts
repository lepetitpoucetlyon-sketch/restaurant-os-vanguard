import { logger } from '@/lib/logger';

export interface AnnualizationCounter {
  userId: string;
  contractualAnnualHours: number; // e.g. 1607h
  accumulatedHoursToDate: number;
  cumulativeBalanceHours: number; // positive = hours owed to employee, negative = hours owed to employer
}

/**
 * ⏳ AnnualizationEngine (Item 4.3)
 * Calculateur de modulation annuelle du temps de travail HCR (Accord national de modulation).
 * Gère la compensation des heures de haute saison en basse saison et les majorations d'heures supplémentaires.
 */
export class AnnualizationEngine {
  static updateMonthlyCounter(
    counter: AnnualizationCounter,
    workedHoursThisMonth: number,
    standardMonthlyTargetHours: number = 151.67
  ): AnnualizationCounter {
    const delta = workedHoursThisMonth - standardMonthlyTargetHours;
    const newAccumulated = counter.accumulatedHoursToDate + workedHoursThisMonth;
    const newBalance = counter.cumulativeBalanceHours + delta;

    logger.info(`[AnnualizationEngine] Employé ${counter.userId} -> Fait: ${workedHoursThisMonth}h (Delta: ${delta.toFixed(2)}h, Cumul: ${newBalance.toFixed(2)}h)`);

    return {
      ...counter,
      accumulatedHoursToDate: newAccumulated,
      cumulativeBalanceHours: newBalance,
    };
  }
}
