/**
 * HcrLegalGuardService.ts
 * 
 * Moteur de contrôle et de conformité légale - Convention Collective HCR (IDCC 1979).
 * Invariants stricts :
 * 1. Repos quotidien minimum : 11 heures consécutives entre la fin d'un shift et le début du suivant.
 * 2. Amplitude journalière maximale : 13 heures maximum (du début de la première prise de poste à la fin de la dernière).
 * 3. Coupures journalières : Maximum 2 shifts par jour (1 seule coupure autorisée).
 * 4. Plafond hebdomadaire absolu : 48 heures de travail effectif par semaine.
 * 5. Détection des heures de nuit : Shift empiétant sur la plage 22h00 - 07h00.
 */

export interface EmployeeShiftEntry {
  id: string;
  employeeId: string;
  startUtc: number; // Timestamp ms
  endUtc: number;   // Timestamp ms
}

export type HcrViolationType = 
  | 'INSUFFICIENT_DAILY_REST_11H'
  | 'MAX_DAILY_AMPLITUDE_EXCEEDED_13H'
  | 'TOO_MANY_SPLIT_SHIFTS'
  | 'MAX_WEEKLY_HOURS_EXCEEDED_48H';

export interface HcrViolation {
  type: HcrViolationType;
  severity: 'BLOCKING' | 'WARNING';
  employeeId: string;
  message: string;
  involvedShiftIds: string[];
}

export interface HcrComplianceReport {
  isCompliant: boolean;
  hasBlockingViolations: boolean;
  violations: HcrViolation[];
  totalEffectiveHours: number;
  nightHoursCount: number;
}

export class HcrLegalGuardService {
  public static readonly MIN_REST_MS = 11 * 60 * 60 * 1000; // 11 heures
  public static readonly MAX_DAILY_AMPLITUDE_MS = 13 * 60 * 60 * 1000; // 13 heures
  public static readonly MAX_WEEKLY_HOURS = 48;

  /**
   * Analyse et valide un ensemble de shifts pour un employé sur une période donnée (ex: semaine).
   */
  public static validateShifts(
    employeeId: string,
    shifts: EmployeeShiftEntry[]
  ): HcrComplianceReport {
    const sorted = [...shifts]
      .filter((s) => s.employeeId === employeeId)
      .sort((a, b) => a.startUtc - b.startUtc);

    const violations: HcrViolation[] = [];
    let totalWorkMs = 0;
    let nightHoursCount = 0;

    // 1. Calcul du temps total et vérification repos 11h
    for (let i = 0; i < sorted.length; i++) {
      const shift = sorted[i];
      const durationMs = Math.max(0, shift.endUtc - shift.startUtc);
      totalWorkMs += durationMs;

      // Calcul des heures de nuit (22h - 07h local)
      nightHoursCount += this.calculateNightHours(shift.startUtc, shift.endUtc);

      // Vérification repos inter-shift avec le shift suivant
      if (i < sorted.length - 1) {
        const nextShift = sorted[i + 1];
        const restDurationMs = nextShift.startUtc - shift.endUtc;

        // Si les shifts ne sont pas le même jour (coupure) mais séparés par une nuit
        if (restDurationMs > 0 && restDurationMs < this.MIN_REST_MS) {
          const restHours = (restDurationMs / (1000 * 60 * 60)).toFixed(1);
          violations.push({
            type: 'INSUFFICIENT_DAILY_REST_11H',
            severity: 'BLOCKING',
            employeeId,
            message: `Repos insuffisant de ${restHours}h entre deux shifts (minimum légal HCR: 11h).`,
            involvedShiftIds: [shift.id, nextShift.id],
          });
        }
      }
    }

    // 2. Vérification amplitude et coupures par journée civile
    const shiftsByDay = this.groupShiftsByDay(sorted);
    for (const [dayKey, dayShifts] of shiftsByDay.entries()) {
      if (dayShifts.length > 2) {
        violations.push({
          type: 'TOO_MANY_SPLIT_SHIFTS',
          severity: 'BLOCKING',
          employeeId,
          message: `Plus de 2 vacations sur la journée du ${dayKey} (maximum 1 coupure autorisée).`,
          involvedShiftIds: dayShifts.map((s) => s.id),
        });
      }

      if (dayShifts.length >= 1) {
        const firstStart = dayShifts[0].startUtc;
        const lastEnd = dayShifts[dayShifts.length - 1].endUtc;
        const dailyAmplitudeMs = lastEnd - firstStart;

        if (dailyAmplitudeMs > this.MAX_DAILY_AMPLITUDE_MS) {
          const ampHours = (dailyAmplitudeMs / (1000 * 60 * 60)).toFixed(1);
          violations.push({
            type: 'MAX_DAILY_AMPLITUDE_EXCEEDED_13H',
            severity: 'BLOCKING',
            employeeId,
            message: `Amplitude journalière de ${ampHours}h le ${dayKey} (maximum légal HCR: 13h).`,
            involvedShiftIds: dayShifts.map((s) => s.id),
          });
        }
      }
    }

    // 3. Vérification plafond hebdomadaire 48h
    const totalEffectiveHours = Number((totalWorkMs / (1000 * 60 * 60)).toFixed(2));
    if (totalEffectiveHours > this.MAX_WEEKLY_HOURS) {
      violations.push({
        type: 'MAX_WEEKLY_HOURS_EXCEEDED_48H',
        severity: 'BLOCKING',
        employeeId,
        message: `Total de ${totalEffectiveHours}h dépasse le plafond légal hebdomadaire de 48h.`,
        involvedShiftIds: sorted.map((s) => s.id),
      });
    }

    const hasBlockingViolations = violations.some((v) => v.severity === 'BLOCKING');

    return {
      isCompliant: violations.length === 0,
      hasBlockingViolations,
      violations,
      totalEffectiveHours,
      nightHoursCount: Number(nightHoursCount.toFixed(2)),
    };
  }

  private static groupShiftsByDay(shifts: EmployeeShiftEntry[]): Map<string, EmployeeShiftEntry[]> {
    const map = new Map<string, EmployeeShiftEntry[]>();
    for (const shift of shifts) {
      const date = new Date(shift.startUtc);
      const dayKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
      const list = map.get(dayKey) || [];
      list.push(shift);
      map.set(dayKey, list);
    }
    return map;
  }

  private static calculateNightHours(startUtc: number, endUtc: number): number {
    let nightMs = 0;
    const stepMs = 15 * 60 * 1000; // 15 min granularity

    for (let t = startUtc; t < endUtc; t += stepMs) {
      const hour = new Date(t).getUTCHours();
      if (hour >= 22 || hour < 7) {
        nightMs += Math.min(stepMs, endUtc - t);
      }
    }

    return nightMs / (1000 * 60 * 60);
  }
}
