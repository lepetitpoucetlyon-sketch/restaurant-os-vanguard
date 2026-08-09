import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export type TipDistributionMethod =
  | 'hours_by_role_weight'  // Pro-rata heures travaillées avec coef par rôle (Recommandé HCR)
  | 'equal_per_shift_staff' // Part égale entre tous les membres du shift
  | 'hours_strict'         // Pro-rata strict des heures travaillées
  | 'points_system';        // Système à points par qualification

export interface RoleWeightConfig {
  serveur: number;       // e.g. 1.0
  chef_rang: number;     // e.g. 1.2
  barman: number;        // e.g. 1.0
  cuisinier: number;     // e.g. 0.5
  chef_cuisinier: number; // e.g. 0.7
  commis: number;        // e.g. 0.3
  plongeur: number;      // e.g. 0.3
  [role: string]: number;
}

export interface TipsDistributionSettings {
  autoTipsDistributionEnabled: boolean;
  tipsDistributionMethod: TipDistributionMethod;
  roleWeights: RoleWeightConfig;
  includeInPayrollExport: boolean;
  minimumHoursForTipEligibility: number; // e.g. 1.0 hour minimum shift
}

export interface StaffShiftParticipation {
  staffId: string;
  staffName: string;
  role: string;
  hoursWorked: number;
}

export interface StaffTipShare {
  staffId: string;
  staffName: string;
  role: string;
  hoursWorked: number;
  weight: number;
  tipAmountInMicrounits: number;
  tipAmountEur: number;
}

export interface TipsDistributionResult {
  shiftId: string;
  totalTipsInMicrounits: number;
  totalTipsEur: number;
  method: TipDistributionMethod;
  shares: StaffTipShare[];
}

export const DEFAULT_TIPS_SETTINGS: TipsDistributionSettings = {
  autoTipsDistributionEnabled: true,
  tipsDistributionMethod: 'hours_by_role_weight',
  roleWeights: {
    serveur: 1.0,
    chef_rang: 1.2,
    barman: 1.0,
    cuisinier: 0.5,
    chef_cuisinier: 0.7,
    commis: 0.3,
    plongeur: 0.3,
  },
  includeInPayrollExport: true,
  minimumHoursForTipEligibility: 1.0,
};

/**
 * 💰 TipsDistributionEngine
 * Moteur de calcul et de répartition équitable des pourboires CB automatiques à la clôture de service.
 * Gère le calcul pro-rata des heures travaillées pondérées par rôle (Loi de Finance HCR).
 */
export class TipsDistributionEngine {
  static calculateDistribution(
    shiftId: string,
    totalTipsInMicrounits: number,
    participants: StaffShiftParticipation[],
    settings: TipsDistributionSettings = DEFAULT_TIPS_SETTINGS
  ): TipsDistributionResult {
    if (totalTipsInMicrounits <= 0 || participants.length === 0) {
      return {
        shiftId,
        totalTipsInMicrounits: 0,
        totalTipsEur: 0,
        method: settings.tipsDistributionMethod,
        shares: [],
      };
    }

    // Filtrer selon l'éligibilité d'heures minimales
    const eligible = participants.filter(
      p => p.hoursWorked >= settings.minimumHoursForTipEligibility
    );

    if (eligible.length === 0) {
      return {
        shiftId,
        totalTipsInMicrounits,
        totalTipsEur: totalTipsInMicrounits / 1_000_000,
        method: settings.tipsDistributionMethod,
        shares: [],
      };
    }

    const shares: StaffTipShare[] = [];

    // 1. MÉTHODE 1: PART ÉGALE
    if (settings.tipsDistributionMethod === 'equal_per_shift_staff') {
      const shareMicrounits = Math.floor(totalTipsInMicrounits / eligible.length);

      for (const p of eligible) {
        shares.push({
          staffId: p.staffId,
          staffName: p.staffName,
          role: p.role,
          hoursWorked: p.hoursWorked,
          weight: 1.0,
          tipAmountInMicrounits: shareMicrounits,
          tipAmountEur: Number((shareMicrounits / 1_000_000).toFixed(2)),
        });
      }
    }
    // 2. MÉTHODE 2: HEURES STRICTES
    else if (settings.tipsDistributionMethod === 'hours_strict') {
      const totalHours = eligible.reduce((sum, p) => sum + p.hoursWorked, 0);

      for (const p of eligible) {
        const ratio = totalHours > 0 ? p.hoursWorked / totalHours : 0;
        const shareMicrounits = Math.floor(totalTipsInMicrounits * ratio);

        shares.push({
          staffId: p.staffId,
          staffName: p.staffName,
          role: p.role,
          hoursWorked: p.hoursWorked,
          weight: 1.0,
          tipAmountInMicrounits: shareMicrounits,
          tipAmountEur: Number((shareMicrounits / 1_000_000).toFixed(2)),
        });
      }
    }
    // 3. MÉTHODE 3 (PAR DÉFAUT): PRO-RATA HEURES TRAVAILLÉES PONDÉRÉES PAR RÔLE
    else {
      let totalWeightedHours = 0;

      const weightedParticipants = eligible.map(p => {
        const weight = settings.roleWeights[p.role.toLowerCase()] ?? 1.0;
        const weightedHours = p.hoursWorked * weight;
        totalWeightedHours += weightedHours;

        return { ...p, weight, weightedHours };
      });

      for (const p of weightedParticipants) {
        const ratio = totalWeightedHours > 0 ? p.weightedHours / totalWeightedHours : 0;
        const shareMicrounits = Math.floor(totalTipsInMicrounits * ratio);

        shares.push({
          staffId: p.staffId,
          staffName: p.staffName,
          role: p.role,
          hoursWorked: p.hoursWorked,
          weight: p.weight,
          tipAmountInMicrounits: shareMicrounits,
          tipAmountEur: Number((shareMicrounits / 1_000_000).toFixed(2)),
        });
      }
    }

    logger.info(
      `[TipsDistributionEngine] Shift ${shiftId} : ${totalTipsInMicrounits / 1_000_000}€ répartis entre ${shares.length} salariés (Méthode: ${settings.tipsDistributionMethod})`
    );

    empireAudit.log({
      module: 'human',
      action: 'TIPS_DISTRIBUTION_CALCULATED',
      details: { shiftId, totalTipsInMicrounits, staffCount: shares.length, method: settings.tipsDistributionMethod },
      severity: 'low',
      timestamp: new Date(),
    });

    return {
      shiftId,
      totalTipsInMicrounits,
      totalTipsEur: Number((totalTipsInMicrounits / 1_000_000).toFixed(2)),
      method: settings.tipsDistributionMethod,
      shares,
    };
  }
}
