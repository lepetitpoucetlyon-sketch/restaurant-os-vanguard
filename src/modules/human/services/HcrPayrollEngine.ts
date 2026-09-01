import { User } from '../domain/schemas/users';

/**
 * 🍷 HcrPayrollEngine — Restaurant OS
 * Moteur de calcul et de pré-paie conforme à la Convention Collective Nationale HCR (IDCC 1979).
 * 
 * Règles Conventionnelles & Légales :
 * - Durée légale hebdomadaire : 35h (ou 39h avec 4h supp régulières)
 * - Heures supplémentaires HCR :
 *   - De la 36e à la 39e heure : majoration de +10% (taux 1.10)
 *   - De la 40e à la 43e heure : majoration de +20% (taux 1.20)
 *   - À partir de la 44e heure : majoration de +50% (taux 1.50)
 * - Heures de nuit HCR (22h00 - 07h00) : compensation / majoration
 * - Avantage en nature repas (Minimum Garanti MG) : 4,15 € par repas (shift > 5h)
 * - Extra d'usage (CDDU) : Indemnité de congés payés de 10% sur le salaire brut total
 */

export const HCR_CONSTANTS = {
  LEGAL_WEEKLY_HOURS: 35,
  CONTRACTUAL_39H_WEEKLY: 39,
  LEGAL_MONTHLY_HOURS: 151.67,
  REPAS_MINIMUM_GARANTI_EUR: 4.15,
  REPAS_MINIMUM_GARANTI_MU: 4_150_000,
  OVERTIME_TIER_1_RATE: 0.10, // 36-39h (+10%)
  OVERTIME_TIER_2_RATE: 0.20, // 40-43h (+20%)
  OVERTIME_TIER_3_RATE: 0.50, // 44h+ (+50%)
  NIGHT_HOUR_START: 22,       // 22h00
  NIGHT_HOUR_END: 7,          // 07h00
  EXTRA_CONGES_PAYES_RATE: 0.10, // 10% pour CDDU
  MU_TO_EUR: 1_000_000,
} as const;

export interface HcrWeeklyHoursBreakdown {
  weekNumber: number;
  totalHours: number;
  regularHours: number;      // <= 35h
  overtimeTier1: number;     // 36h à 39h (+10%)
  overtimeTier2: number;     // 40h à 43h (+20%)
  overtimeTier3: number;     // 44h+ (+50%)
  nightHours: number;        // 22h-7h
  mealCount: number;         // Nombre de repas (MG)
}

export interface HcrEmployeeMonthlyPayroll {
  userId: string;
  userName: string;
  role: string;
  contractType: string;
  periodMonth: string;       // "YYYY-MM"
  hourlyRateEur: number;
  baseSalaryEur: number;
  
  // Heures
  totalHours: number;
  regularHours: number;
  overtimeTier1Hours: number; // à +10%
  overtimeTier2Hours: number; // à +20%
  overtimeTier3Hours: number; // à +50%
  nightHours: number;
  
  // Montants Bruts & Compléments
  regularPayEur: number;
  overtimeTier1PayEur: number;
  overtimeTier2PayEur: number;
  overtimeTier3PayEur: number;
  nightBonusEur: number;
  congesPayesExtraEur: number; // 10% si CDDU
  
  // Avantages en Nature & Net
  mealCount: number;
  mealAllowanceEur: number; // Avantage en nature repas (MG × nbRepas)
  grossTotalSalaryEur: number; // Total brut soumis à cotisations
  netEstimatedSalaryEur: number; // Net indicatif (~78% du brut)
  employerCostEstimatedEur: number; // Coût employeur global (~142% du brut)
}

export class HcrPayrollEngine {
  /**
   * Calcule le nombre d'heures de nuit (entre 22h00 et 07h00) pour un intervalle donné.
   */
  static computeNightHours(start: Date, end: Date): number {
    let nightMs = 0;
    const current = new Date(start);
    
    // Parcourt minute par minute pour précision absolue
    while (current < end) {
      const h = current.getHours();
      if (h >= HCR_CONSTANTS.NIGHT_HOUR_START || h < HCR_CONSTANTS.NIGHT_HOUR_END) {
        nightMs += 60_000;
      }
      current.setTime(current.getTime() + 60_000);
    }
    
    return Number((nightMs / (1000 * 60 * 60)).toFixed(2));
  }

  /**
   * Découpe un ensemble d'heures hebdomadaires en heures normales et tranches supplémentaires HCR.
   */
  static breakdownWeeklyHours(
    weeklyTotalHours: number,
    nightHours: number = 0,
    mealCount: number = 0,
    weekNumber: number = 1
  ): HcrWeeklyHoursBreakdown {
    const regularHours = Math.min(weeklyTotalHours, HCR_CONSTANTS.LEGAL_WEEKLY_HOURS);
    let rem = Math.max(0, weeklyTotalHours - HCR_CONSTANTS.LEGAL_WEEKLY_HOURS);

    // Tranche 1 : 36e à 39e heure (max 4h)
    const overtimeTier1 = Math.min(rem, 4);
    rem = Math.max(0, rem - overtimeTier1);

    // Tranche 2 : 40e à 43e heure (max 4h)
    const overtimeTier2 = Math.min(rem, 4);
    rem = Math.max(0, rem - overtimeTier2);

    // Tranche 3 : 44e heure et au-delà
    const overtimeTier3 = rem;

    return {
      weekNumber,
      totalHours: Number(weeklyTotalHours.toFixed(2)),
      regularHours: Number(regularHours.toFixed(2)),
      overtimeTier1: Number(overtimeTier1.toFixed(2)),
      overtimeTier2: Number(overtimeTier2.toFixed(2)),
      overtimeTier3: Number(overtimeTier3.toFixed(2)),
      nightHours: Number(nightHours.toFixed(2)),
      mealCount,
    };
  }

  /**
   * Calcule la pré-paie mensuelle complète d'un collaborateur salarié HCR.
   */
  static computeMonthlyPayroll(
    user: User,
    shifts: { startTime: string; endTime: string; date: string }[],
    month: string // "YYYY-MM"
  ): HcrEmployeeMonthlyPayroll {
    const rateInMu = user.hourlyRateInMicrounits ?? (15 * HCR_CONSTANTS.MU_TO_EUR);
    const hourlyRateEur = rateInMu / HCR_CONSTANTS.MU_TO_EUR;
    const isExtraCddu = user.contractType === 'extra_cddu';

    let totalDurationHours = 0;
    let totalNightHours = 0;
    let totalMealCount = 0;

    for (const shift of shifts) {
      const start = new Date(`${shift.date}T${shift.startTime}`);
      const end = new Date(`${shift.date}T${shift.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      
      if (diffMs > 0) {
        const hours = diffMs / (1000 * 60 * 60);
        totalDurationHours += hours;
        totalNightHours += this.computeNightHours(start, end);
        
        // Repas accordé si shift >= 5h de travail
        if (hours >= 5) {
          totalMealCount += (hours >= 9 ? 2 : 1);
        }
      }
    }

    // Répartition conventionnelle HCR mensuelle (base 4.33 semaines)
    const weeklyAvgHours = totalDurationHours / 4.33;
    const weeklyBreakdown = this.breakdownWeeklyHours(weeklyAvgHours);

    const regularHours = Number((weeklyBreakdown.regularHours * 4.33).toFixed(2));
    const overtimeTier1Hours = Number((weeklyBreakdown.overtimeTier1 * 4.33).toFixed(2));
    const overtimeTier2Hours = Number((weeklyBreakdown.overtimeTier2 * 4.33).toFixed(2));
    const overtimeTier3Hours = Number((weeklyBreakdown.overtimeTier3 * 4.33).toFixed(2));

    // Calculs de rémunération
    const regularPayEur = regularHours * hourlyRateEur;
    const overtimeTier1PayEur = overtimeTier1Hours * (hourlyRateEur * (1 + HCR_CONSTANTS.OVERTIME_TIER_1_RATE));
    const overtimeTier2PayEur = overtimeTier2Hours * (hourlyRateEur * (1 + HCR_CONSTANTS.OVERTIME_TIER_2_RATE));
    const overtimeTier3PayEur = overtimeTier3Hours * (hourlyRateEur * (1 + HCR_CONSTANTS.OVERTIME_TIER_3_RATE));
    
    // Majoration forfaitaire / conventionnelle nuit (+15% pour les heures de nuit)
    const nightBonusEur = totalNightHours * (hourlyRateEur * 0.15);

    // Sous-total brut hors congés payés extra
    const baseAndOvertimeGross = regularPayEur + overtimeTier1PayEur + overtimeTier2PayEur + overtimeTier3PayEur + nightBonusEur;
    
    // Congés payés 10% pour extra CDDU
    const congesPayesExtraEur = isExtraCddu ? (baseAndOvertimeGross * HCR_CONSTANTS.EXTRA_CONGES_PAYES_RATE) : 0;

    // Avantage repas MG
    const mealAllowanceEur = totalMealCount * HCR_CONSTANTS.REPAS_MINIMUM_GARANTI_EUR;

    const grossTotalSalaryEur = Number((baseAndOvertimeGross + congesPayesExtraEur + mealAllowanceEur).toFixed(2));
    const netEstimatedSalaryEur = Number(((grossTotalSalaryEur - mealAllowanceEur) * 0.78).toFixed(2));
    const employerCostEstimatedEur = Number((grossTotalSalaryEur * 1.42).toFixed(2));

    return {
      userId: user.id,
      userName: user.name,
      role: user.role,
      contractType: user.contractType || 'cdi_39h',
      periodMonth: month,
      hourlyRateEur: Number(hourlyRateEur.toFixed(2)),
      baseSalaryEur: Number((regularHours * hourlyRateEur).toFixed(2)),
      totalHours: Number(totalDurationHours.toFixed(2)),
      regularHours,
      overtimeTier1Hours,
      overtimeTier2Hours,
      overtimeTier3Hours,
      nightHours: Number(totalNightHours.toFixed(2)),
      regularPayEur: Number(regularPayEur.toFixed(2)),
      overtimeTier1PayEur: Number(overtimeTier1PayEur.toFixed(2)),
      overtimeTier2PayEur: Number(overtimeTier2PayEur.toFixed(2)),
      overtimeTier3PayEur: Number(overtimeTier3PayEur.toFixed(2)),
      nightBonusEur: Number(nightBonusEur.toFixed(2)),
      congesPayesExtraEur: Number(congesPayesExtraEur.toFixed(2)),
      mealCount: totalMealCount,
      mealAllowanceEur: Number(mealAllowanceEur.toFixed(2)),
      grossTotalSalaryEur,
      netEstimatedSalaryEur,
      employerCostEstimatedEur,
    };
  }

  /**
   * Génère une ligne d'export au format standard CSV pour Silae / Payfit / Expert-comptable.
   */
  static exportToPrepaieCsv(payrolls: HcrEmployeeMonthlyPayroll[]): string {
    const headers = [
      'Matricule_ID',
      'Nom_Employe',
      'Role',
      'Type_Contrat',
      'Mois',
      'Taux_Horaire_EUR',
      'Heures_Totales',
      'Heures_Normales',
      'Heures_Supp_10pct',
      'Heures_Supp_20pct',
      'Heures_Supp_50pct',
      'Heures_Nuit',
      'Repas_MG_Nombre',
      'Brut_Total_EUR',
      'Net_Estime_EUR',
      'Cout_Employeur_Estime_EUR'
    ].join(';');

    const rows = payrolls.map(p => [
      p.userId,
      `"${p.userName}"`,
      p.role,
      p.contractType,
      p.periodMonth,
      p.hourlyRateEur.toFixed(2),
      p.totalHours.toFixed(2),
      p.regularHours.toFixed(2),
      p.overtimeTier1Hours.toFixed(2),
      p.overtimeTier2Hours.toFixed(2),
      p.overtimeTier3Hours.toFixed(2),
      p.nightHours.toFixed(2),
      p.mealCount,
      p.grossTotalSalaryEur.toFixed(2),
      p.netEstimatedSalaryEur.toFixed(2),
      p.employerCostEstimatedEur.toFixed(2)
    ].join(';'));

    return [headers, ...rows].join('\n');
  }
}
