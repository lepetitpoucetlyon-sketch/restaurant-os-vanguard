import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface MonthlyWorkHoursInput {
  employeeId: string;
  employeeName: string;
  contractualMonthlyHours: number; // ex: 151.67h (35h/semaine)
  hourlyRateInMicrounits: number; // ex: 12.00 € (12_000_000)
  totalHoursWorked: number; // ex: 172h
  nightHoursWorked: number; // 22h - 06h (majoration +30% HCR)
  sundayHoursWorked: number; // (+20% conventionnel)
  guaranteedHolidayHoursWorked: number; // (+100%)
}

export interface HCRPayrollBreakdown {
  employeeId: string;
  basePayInMicrounits: number;
  overtime10PctInMicrounits: number; // 36-39h (+10%)
  overtime20PctInMicrounits: number; // 40-43h (+20%)
  overtime50PctInMicrounits: number; // >43h (+50%)
  nightBonusInMicrounits: number;
  sundayBonusInMicrounits: number;
  holidayBonusInMicrounits: number;
  totalGrossInMicrounits: number;
}

/**
 * HCRPayrollCalculatorService — Angle mort G1.
 * Calculateur de paie de la Convention Collective Nationale des Hôtels, Cafés, Restaurants (IDCC 1979) :
 * Majoration heures supplémentaires (10%, 20%, 50%), heures de nuit 22h-6h (+30%), travail dimanche (+20%) et jours fériés garantis (+100%).
 */
export class HCRPayrollCalculatorService {
  static computeMonthlyPayroll(
    tenantId: string,
    adminId: string,
    periodLabel: string,
    input: MonthlyWorkHoursInput
  ): HCRPayrollBreakdown {
    const hourlyRate = input.hourlyRateInMicrounits;
    const basePayInMicrounits = Math.round(input.contractualMonthlyHours * hourlyRate);

    const overtimeTotalHours = Math.max(0, input.totalHoursWorked - input.contractualMonthlyHours);

    // HCR monthly overtime tranches (for ~4.33 weeks/month):
    // 36th-39th h/week -> max ~17.33h/month at +10% (1.10)
    // 40th-43rd h/week -> next ~17.33h/month at +20% (1.20)
    // >43rd h/week -> remainder at +50% (1.50)
    const tier1Hours = Math.min(overtimeTotalHours, 17.33);
    const tier2Hours = Math.min(Math.max(0, overtimeTotalHours - 17.33), 17.33);
    const tier3Hours = Math.max(0, overtimeTotalHours - 34.66);

    const overtime10PctInMicrounits = Math.round(tier1Hours * hourlyRate * 1.10);
    const overtime20PctInMicrounits = Math.round(tier2Hours * hourlyRate * 1.20);
    const overtime50PctInMicrounits = Math.round(tier3Hours * hourlyRate * 1.50);

    // HCR Night Bonus: +30% on hourly rate for 22h-06h
    const nightBonusInMicrounits = Math.round(input.nightHoursWorked * hourlyRate * 0.30);
    // Sunday Bonus: +20%
    const sundayBonusInMicrounits = Math.round(input.sundayHoursWorked * hourlyRate * 0.20);
    // Holiday Bonus: +100%
    const holidayBonusInMicrounits = Math.round(input.guaranteedHolidayHoursWorked * hourlyRate * 1.00);

    const totalGrossInMicrounits = basePayInMicrounits +
      overtime10PctInMicrounits +
      overtime20PctInMicrounits +
      overtime50PctInMicrounits +
      nightBonusInMicrounits +
      sundayBonusInMicrounits +
      holidayBonusInMicrounits;

    NexusEventBus.emit('hr.hcr_payroll_computed', {
      v: 1,
      tenantId,
      employeeId: input.employeeId,
      periodLabel,
      basePayInMicrounits,
      overtimeInMicrounits: overtime10PctInMicrounits + overtime20PctInMicrounits + overtime50PctInMicrounits,
      nightBonusInMicrounits,
      totalGrossInMicrounits,
      computedAt: Date.now(),
    });

    AuditLogger.logAction({
      adminId,
      action: 'HCR_PAYROLL_CALCULATED',
      targetId: `PAYROLL-${tenantId}-${input.employeeId}-${periodLabel}`,
      ipAddress: '127.0.0.1',
      metadata: {
        totalGrossInMicrounits,
        overtimeTotalHours,
      },
    });

    return {
      employeeId: input.employeeId,
      basePayInMicrounits,
      overtime10PctInMicrounits,
      overtime20PctInMicrounits,
      overtime50PctInMicrounits,
      nightBonusInMicrounits,
      sundayBonusInMicrounits,
      holidayBonusInMicrounits,
      totalGrossInMicrounits,
    };
  }
}
