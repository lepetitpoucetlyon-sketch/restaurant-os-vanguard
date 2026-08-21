import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface EmployeeTipWeight {
  employeeId: string;
  employeeName: string;
  hoursWorked: number;
}

export interface TipPoolDistribution {
  periodLabel: string;
  totalPoolInMicrounits: number;
  distributions: { employeeId: string; amountInMicrounits: number; hoursWorked: number }[];
  isExoneratedUrssaf: boolean; // Pourboires exonérés de charges sociales (Loi de finances 2022)
}

/**
 * SmartTipDigitalPoolService — Angle mort L84.
 * Répartition équitable des pourboires digitaux CB (Tronc de pourboires) :
 * Distribution proratisée au nombre d'heures travaillées avec respect de l'exonération sociale et fiscale Urssaf.
 */
export class SmartTipDigitalPoolService {
  static distributePool(
    tenantId: string,
    periodLabel: string,
    totalPoolInMicrounits: number,
    employees: EmployeeTipWeight[]
  ): TipPoolDistribution {
    const totalHours = employees.reduce((sum, e) => sum + e.hoursWorked, 0);

    let allocatedSum = 0;
    const distributions = employees.map((e, index) => {
      if (index === employees.length - 1) {
        // Last element gets exact remaining indivisible microunits
        const remaining = totalPoolInMicrounits - allocatedSum;
        return { employeeId: e.employeeId, amountInMicrounits: remaining, hoursWorked: e.hoursWorked };
      }
      const part = totalHours > 0 ? Math.floor((totalPoolInMicrounits * e.hoursWorked) / totalHours) : 0;
      allocatedSum += part;
      return { employeeId: e.employeeId, amountInMicrounits: part, hoursWorked: e.hoursWorked };
    });

    NexusEventBus.emit('finance.smart_tip_distributed', {
      v: 1,
      tenantId,
      periodLabel,
      totalPoolInMicrounits,
      beneficiaryCount: employees.length,
      distributedAt: Date.now(),
    });

    return {
      periodLabel,
      totalPoolInMicrounits,
      distributions,
      isExoneratedUrssaf: true,
    };
  }
}
