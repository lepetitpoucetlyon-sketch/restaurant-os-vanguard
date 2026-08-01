import { describe, it, expect } from 'vitest';
import { checkCompliance } from './scheduleCompliance';
import type { Shift } from './scheduleCompliance';

function shift(id: string, userId: string, date: string, start: string, end: string): Shift {
    return { id, userId, date, startTime: start, endTime: end };
}

describe('checkCompliance', () => {
    it('passes a normal schedule', () => {
        const shifts: Shift[] = [
            shift('s1', 'u1', '2026-07-20', '09:00', '17:00'),
            shift('s2', 'u1', '2026-07-21', '09:00', '17:00'),
        ];
        const violations = checkCompliance(shifts);
        const blocking = violations.filter(v => v.severity === 'blocking');
        expect(blocking).toHaveLength(0);
    });

    it('detects insufficient rest between shifts', () => {
        const shifts: Shift[] = [
            shift('s1', 'u1', '2026-07-20', '14:00', '23:00'),
            shift('s2', 'u1', '2026-07-21', '06:00', '14:00'),
        ];
        const violations = checkCompliance(shifts);
        expect(violations.some(v => v.ruleId === 'min_rest')).toBe(true);
    });

    it('detects daily amplitude exceeding max', () => {
        const shifts: Shift[] = [
            shift('s1', 'u1', '2026-07-20', '06:00', '23:00'),
        ];
        const violations = checkCompliance(shifts);
        expect(violations.some(v => v.ruleId === 'max_daily_hours')).toBe(true);
    });

    it('detects 7+ consecutive days', () => {
        const shifts: Shift[] = [];
        for (let i = 20; i <= 27; i++) {
            shifts.push(shift(`s${i}`, 'u1', `2026-07-${i}`, '09:00', '17:00'));
        }
        const violations = checkCompliance(shifts);
        expect(violations.some(v => v.ruleId === 'max_consecutive_days')).toBe(true);
    });

    it('allows exactly 6 consecutive days', () => {
        const shifts: Shift[] = [];
        for (let i = 20; i <= 25; i++) {
            shifts.push(shift(`s${i}`, 'u1', `2026-07-${i}`, '09:00', '17:00'));
        }
        const violations = checkCompliance(shifts);
        expect(violations.some(v => v.ruleId === 'max_consecutive_days')).toBe(false);
    });

    it('detects weekly hours exceeding max', () => {
        const shifts: Shift[] = [];
        for (let i = 20; i <= 25; i++) {
            shifts.push(shift(`s${i}`, 'u1', `2026-07-${i}`, '06:00', '15:00'));
        }
        const violations = checkCompliance(shifts);
        expect(violations.some(v => v.ruleId === 'max_weekly_hours')).toBe(true);
    });

    it('respects custom config', () => {
        const shifts: Shift[] = [
            shift('s1', 'u1', '2026-07-20', '06:00', '20:00'),
        ];
        const violations = checkCompliance(shifts, {
            minRestBetweenShifts: 11,
            maxConsecutiveDays: 6,
            maxDailyHours: 15,
            maxWeeklyHours: 60,
            minBreakAfterHours: 6,
            breakDurationMinutes: 20,
        });
        expect(violations.some(v => v.ruleId === 'max_daily_hours')).toBe(false);
    });
});
