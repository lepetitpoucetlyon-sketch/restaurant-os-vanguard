import { describe, it, expect } from 'vitest';
import { CoolingCycleService, type CoolingCycleInput } from './CoolingCycleService';

describe('CoolingCycleService', () => {
  it('validates a compliant rapid cooling cycle (68°C to 8°C in 95 min)', () => {
    const t0 = Date.UTC(2026, 7, 10, 14, 0); // 14:00
    const tEnd = Date.UTC(2026, 7, 10, 15, 35); // 15:35 (95 min)

    const cycle: CoolingCycleInput = {
      cycleId: 'cycle-001',
      tenantId: 'tenant-lyon',
      dishName: 'Bœuf Bourguignon',
      batchNumber: 'LOT-20260810-01',
      quantityKg: 15,
      cellId: 'CELLULE-1',
      startReading: { timestampUtc: t0, tempCelsius: 68.0, operatorId: 'chef-marc' },
      finalReading: { timestampUtc: tEnd, tempCelsius: 8.0, operatorId: 'chef-marc' },
    };

    const report = CoolingCycleService.evaluateCycle(cycle);

    expect(report.isCompliant).toBe(true);
    expect(report.status).toBe('COMPLIANT');
    expect(report.durationMinutes).toBe(95);
    expect(report.coolingRateCPerMin).toBeCloseTo(0.63, 1);
    expect(report.correctiveActionRequired).toBe(false);
  });

  it('flags non-compliance if target temperature is not reached within 120 min', () => {
    const t0 = Date.UTC(2026, 7, 10, 14, 0);
    const tEnd = Date.UTC(2026, 7, 10, 16, 5); // 125 min (> 120 min)

    const cycle: CoolingCycleInput = {
      cycleId: 'cycle-002',
      tenantId: 'tenant-lyon',
      dishName: 'Sauce Tomate Maison',
      batchNumber: 'LOT-20260810-02',
      quantityKg: 20,
      cellId: 'CELLULE-2',
      startReading: { timestampUtc: t0, tempCelsius: 65.0, operatorId: 'commis-jean' },
      finalReading: { timestampUtc: tEnd, tempCelsius: 12.0, operatorId: 'commis-jean' }, // 12°C > 10°C
      correctiveAction: 'Plat replacé en cellule turbo 15 min supplémentaires',
    };

    const report = CoolingCycleService.evaluateCycle(cycle);

    expect(report.isCompliant).toBe(false);
    expect(report.status).toBe('NON_COMPLIANT');
    expect(report.durationMinutes).toBe(125);
    expect(report.correctiveActionRequired).toBe(true);
    expect(report.correctiveActionApplied).toContain('cellule turbo');
  });
});
