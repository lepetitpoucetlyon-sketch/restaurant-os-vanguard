export interface NightHoursSegment {
  startHour: number; // ex: 20.0
  endHour: number;   // ex: 02.0 (représenté 26.0 si après minuit)
}

export interface NightBonusResult {
  totalNightHours: number; // Heures entre 22h et 06h (22.0 et 30.0)
  hourlyBaseRateInMicrounits: number;
  bonusAmountInMicrounits: number; // +30% CCN HCR
}

/**
 * NightWorkBonusCalculatorService — Angle mort T67.
 * Calcul précis des majorations de travail de nuit HCR (22h00 - 06h00) :
 * Majoration légale de +30% sur le taux horaire de base conventionnel.
 */
export class NightWorkBonusCalculatorService {
  public static readonly NIGHT_BONUS_RATE_PCT = 30.0;

  static computeNightBonus(
    startHour: number,
    endHour: number,
    hourlyBaseRateInMicrounits: number
  ): NightBonusResult {
    // Standard window: 22h00 to 06h00 (or 30.0 next day morning)
    const nightStart = 22.0;
    const nightEnd = 30.0; // 06h00 J+1

    const effectiveStart = Math.max(startHour, nightStart);
    const effectiveEnd = Math.min(endHour, nightEnd);

    const totalNightHours = Math.max(0, Math.round((effectiveEnd - effectiveStart) * 10) / 10);
    const bonusAmountInMicrounits = Math.round(totalNightHours * hourlyBaseRateInMicrounits * 0.30);

    return {
      totalNightHours,
      hourlyBaseRateInMicrounits,
      bonusAmountInMicrounits,
    };
  }
}
