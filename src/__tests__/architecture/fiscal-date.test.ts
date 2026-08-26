import { describe, it, expect } from 'vitest';
import { fiscalDayOf, isNightService, formatFiscalTimestamp } from '@/lib/temporal/fiscalDate';

describe('Fiscal & Temporal Date Engine', () => {
  it('correctly maps 23:58 and 01:30 of the same night service to the same fiscal day', () => {
    // 26 août 2026 à 23h58 (heure de Paris)
    const saleBeforeMidnight = new Date('2026-08-26T23:58:00+02:00');
    // 27 août 2026 à 01h30 (heure de Paris)
    const saleAfterMidnight = new Date('2026-08-27T01:30:00+02:00');

    const fiscalDayBefore = fiscalDayOf(saleBeforeMidnight, { timeZone: 'Europe/Paris', cutoffHour: 5 });
    const fiscalDayAfter = fiscalDayOf(saleAfterMidnight, { timeZone: 'Europe/Paris', cutoffHour: 5 });

    expect(fiscalDayBefore).toBe('2026-08-26');
    expect(fiscalDayAfter).toBe('2026-08-26');
    expect(fiscalDayBefore).toEqual(fiscalDayAfter);
  });

  it('maps morning service (after cutoff) to the current calendar day', () => {
    // 27 août 2026 à 08h00 (heure de Paris)
    const morningSale = new Date('2026-08-27T08:00:00+02:00');
    const fiscalDay = fiscalDayOf(morningSale, { timeZone: 'Europe/Paris', cutoffHour: 5 });

    expect(fiscalDay).toBe('2026-08-27');
  });

  it('detects night service correctly based on cutoffHour', () => {
    const nightTime = new Date('2026-08-27T02:15:00+02:00');
    const dayTime = new Date('2026-08-27T14:30:00+02:00');

    expect(isNightService(nightTime, { cutoffHour: 5 })).toBe(true);
    expect(isNightService(dayTime, { cutoffHour: 5 })).toBe(false);
  });

  it('formats timestamp with explicit timezone', () => {
    const d = new Date('2026-08-26T15:30:00Z');
    const formatted = formatFiscalTimestamp(d, 'Europe/Paris');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('17:30'); // UTC+2 in summer
  });
});
