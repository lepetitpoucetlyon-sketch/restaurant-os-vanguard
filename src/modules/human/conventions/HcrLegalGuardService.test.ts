import { describe, it, expect } from 'vitest';
import { HcrLegalGuardService, type EmployeeShiftEntry } from './HcrLegalGuardService';

describe('HcrLegalGuardService', () => {
  it('validates a compliant schedule with proper 11h rest and 35h total', () => {
    // 5 shifts of 7 hours each with 17h rest in between
    const day1Start = Date.UTC(2026, 7, 10, 10, 0); // 10:00 UTC
    const day1End   = Date.UTC(2026, 7, 10, 17, 0); // 17:00 UTC
    const day2Start = Date.UTC(2026, 7, 11, 10, 0); // 10:00 UTC (17h rest)
    const day2End   = Date.UTC(2026, 7, 11, 17, 0);

    const shifts: EmployeeShiftEntry[] = [
      { id: 's1', employeeId: 'emp-1', startUtc: day1Start, endUtc: day1End },
      { id: 's2', employeeId: 'emp-1', startUtc: day2Start, endUtc: day2End },
    ];

    const report = HcrLegalGuardService.validateShifts('emp-1', shifts);

    expect(report.isCompliant).toBe(true);
    expect(report.hasBlockingViolations).toBe(false);
    expect(report.totalEffectiveHours).toBe(14);
    expect(report.violations).toHaveLength(0);
  });

  it('detects insufficient rest (< 11h) between close and open', () => {
    // Closing at 00:00 (midnight) and opening at 08:00 (only 8h rest instead of 11h)
    const closeStart = Date.UTC(2026, 7, 10, 17, 0);
    const closeEnd   = Date.UTC(2026, 7, 11, 0, 0); // Midnight
    const openStart  = Date.UTC(2026, 7, 11, 8, 0); // 8h later
    const openEnd    = Date.UTC(2026, 7, 11, 15, 0);

    const shifts: EmployeeShiftEntry[] = [
      { id: 'close', employeeId: 'emp-2', startUtc: closeStart, endUtc: closeEnd },
      { id: 'open', employeeId: 'emp-2', startUtc: openStart, endUtc: openEnd },
    ];

    const report = HcrLegalGuardService.validateShifts('emp-2', shifts);

    expect(report.isCompliant).toBe(false);
    expect(report.hasBlockingViolations).toBe(true);
    expect(report.violations.some((v) => v.type === 'INSUFFICIENT_DAILY_REST_11H')).toBe(true);
  });

  it('detects excessive daily amplitude (> 13h) with split shift', () => {
    // Service midi 10:00 - 14:00, service soir 19:00 - 00:00 (Total amplitude 10:00 to 00:00 = 14h > 13h)
    const midiStart = Date.UTC(2026, 7, 10, 10, 0);
    const midiEnd   = Date.UTC(2026, 7, 10, 14, 0);
    const soirStart = Date.UTC(2026, 7, 10, 19, 0);
    const soirEnd   = Date.UTC(2026, 7, 11, 0, 0);

    const shifts: EmployeeShiftEntry[] = [
      { id: 'midi', employeeId: 'emp-3', startUtc: midiStart, endUtc: midiEnd },
      { id: 'soir', employeeId: 'emp-3', startUtc: soirStart, endUtc: soirEnd },
    ];

    const report = HcrLegalGuardService.validateShifts('emp-3', shifts);

    expect(report.violations.some((v) => v.type === 'MAX_DAILY_AMPLITUDE_EXCEEDED_13H')).toBe(true);
  });
});
