import { describe, it, expect } from 'vitest';
import { HcrPayrollEngine, HCR_CONSTANTS } from '@/modules/human/services/HcrPayrollEngine';
import { User } from '@/modules/human/domain/schemas/users';

describe('HcrPayrollEngine — Convention Collective HCR (IDCC 1979)', () => {
  it('découpe correctement les heures supplémentaires HCR par tranche (+10%, +20%, +50%)', () => {
    // Cas : 46 heures dans la semaine
    // - 35h régulières
    // - 4h (36e à 39e) à +10%
    // - 4h (40e à 43e) à +20%
    // - 3h (44e à 46e) à +50%
    const breakdown = HcrPayrollEngine.breakdownWeeklyHours(46);

    expect(breakdown.totalHours).toBe(46);
    expect(breakdown.regularHours).toBe(35);
    expect(breakdown.overtimeTier1).toBe(4);
    expect(breakdown.overtimeTier2).toBe(4);
    expect(breakdown.overtimeTier3).toBe(3);
  });

  it('calcule correctement les heures de nuit entre 22h et 7h', () => {
    // Shift de 18h00 à 01h00 du matin (7h total, dont 3h de nuit : 22h-01h)
    const start = new Date('2026-09-01T18:00:00');
    const end = new Date('2026-09-02T01:00:00');

    const nightHours = HcrPayrollEngine.computeNightHours(start, end);
    expect(nightHours).toBe(3);
  });

  it('calcule la paie mensuelle d\'un salarié CDI 39h avec avantage repas MG', () => {
    const mockUser: User = {
      id: 'usr_cdi_01',
      type: 'user',
      name: 'Thomas Chef de Rang',
      role: 'server',
      status: 'active',
      contractType: 'cdi_39h',
      hourlyRateInMicrounits: 14 * 1_000_000, // 14.00 € / h
      schemaVersion: 2,
      updatedAt: Date.now(),
    };

    // 20 shifts de 8h (160h total), finissant à 23h (1h de nuit par shift)
    const shifts = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      startTime: '15:00',
      endTime: '23:00',
    }));

    const payroll = HcrPayrollEngine.computeMonthlyPayroll(mockUser, shifts, '2026-09');

    expect(payroll.userId).toBe('usr_cdi_01');
    expect(payroll.totalHours).toBe(160);
    expect(payroll.hourlyRateEur).toBe(14);
    expect(payroll.mealCount).toBe(20);
    expect(payroll.mealAllowanceEur).toBeCloseTo(20 * HCR_CONSTANTS.REPAS_MINIMUM_GARANTI_EUR, 2);
    expect(payroll.grossTotalSalaryEur).toBeGreaterThan(payroll.baseSalaryEur);
    expect(payroll.employerCostEstimatedEur).toBeGreaterThan(payroll.grossTotalSalaryEur);
  });

  it('applique l\'indemnité de congés payés de 10% pour un Extra CDDU', () => {
    const mockExtra: User = {
      id: 'usr_extra_01',
      type: 'user',
      name: 'Sophie Extra',
      role: 'server',
      status: 'active',
      contractType: 'extra_cddu',
      hourlyRateInMicrounits: 15 * 1_000_000, // 15 € / h
      schemaVersion: 2,
      updatedAt: Date.now(),
    };

    const shifts = [
      { date: '2026-09-05', startTime: '18:00', endTime: '23:00' }, // 5h
      { date: '2026-09-06', startTime: '18:00', endTime: '23:00' }, // 5h
    ];

    const payroll = HcrPayrollEngine.computeMonthlyPayroll(mockExtra, shifts, '2026-09');

    expect(payroll.totalHours).toBe(10);
    expect(payroll.congesPayesExtraEur).toBeGreaterThan(0);
    expect(payroll.congesPayesExtraEur).toBeCloseTo(15.45, 2);
  });

  it('génère un export CSV structuré conforme Silae / PayFit', () => {
    const mockUser: User = {
      id: 'usr_export_01',
      type: 'user',
      name: 'Lucas Barman',
      role: 'bartender',
      status: 'active',
      contractType: 'cdi_39h',
      hourlyRateInMicrounits: 16 * 1_000_000,
      schemaVersion: 2,
      updatedAt: Date.now(),
    };

    const payroll = HcrPayrollEngine.computeMonthlyPayroll(
      mockUser,
      [{ date: '2026-09-01', startTime: '10:00', endTime: '18:00' }],
      '2026-09'
    );

    const csv = HcrPayrollEngine.exportToPrepaieCsv([payroll]);
    expect(csv).toContain('Matricule_ID;Nom_Employe;Role;Type_Contrat;Mois');
    expect(csv).toContain('usr_export_01;"Lucas Barman";bartender;cdi_39h;2026-09');
  });
});
