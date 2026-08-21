export interface ShiftInterval {
  startHour: number; // ex: 10.0 (10h00)
  endHour: number;   // ex: 23.5 (23h30)
}

export interface AmplitudeEvaluation {
  totalAmplitudeHours: number;
  isLegalWithinHCR: boolean; // Max 13h / jour
  breachExcessHours: number;
}

/**
 * MaxShiftAmplitudeGuard — Angle mort T64.
 * Garde d'amplitude maximale quotidienne HCR (Art. 21.2 CCN HCR) :
 * L'amplitude de travail ne peut dépasser 13 heures au cours d'une même journée civile ou service de coupure.
 */
export class MaxShiftAmplitudeGuard {
  public static readonly MAX_HCR_AMPLITUDE_HOURS = 13.0;

  static evaluateAmplitude(intervals: ShiftInterval[]): AmplitudeEvaluation {
    if (intervals.length === 0) {
      return { totalAmplitudeHours: 0, isLegalWithinHCR: true, breachExcessHours: 0 };
    }

    const minStart = Math.min(...intervals.map(i => i.startHour));
    const maxEnd = Math.max(...intervals.map(i => i.endHour));
    const totalAmplitudeHours = Math.round((maxEnd - minStart) * 10) / 10;

    const isLegalWithinHCR = totalAmplitudeHours <= this.MAX_HCR_AMPLITUDE_HOURS;
    const breachExcessHours = Math.max(0, totalAmplitudeHours - this.MAX_HCR_AMPLITUDE_HOURS);

    return {
      totalAmplitudeHours,
      isLegalWithinHCR,
      breachExcessHours,
    };
  }
}
