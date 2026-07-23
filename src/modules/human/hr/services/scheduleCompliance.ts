interface Shift {
    id: string;
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
}

interface ComplianceViolation {
    ruleId: string;
    severity: 'warning' | 'blocking';
    shiftId: string;
    userId: string;
    message: string;
}

interface HcrConfig {
    minRestBetweenShifts: number;
    maxConsecutiveDays: number;
    maxDailyHours: number;
    maxWeeklyHours: number;
    minBreakAfterHours: number;
    breakDurationMinutes: number;
}

const DEFAULT_HCR: HcrConfig = {
    minRestBetweenShifts: 11,
    maxConsecutiveDays: 6,
    maxDailyHours: 11,
    maxWeeklyHours: 48,
    minBreakAfterHours: 6,
    breakDurationMinutes: 20,
};

function parseTime(date: string, time: string): number {
    return new Date(`${date}T${time}`).getTime();
}

function hoursOf(shift: Shift): number {
    const start = parseTime(shift.date, shift.startTime);
    const end = parseTime(shift.date, shift.endTime);
    return Math.max(0, (end - start) / (1000 * 60 * 60));
}

function daysBetween(a: string, b: string): number {
    return Math.round(
        (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
    );
}

export function checkCompliance(
    shifts: Shift[],
    config: HcrConfig = DEFAULT_HCR,
): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    const byUser = new Map<string, Shift[]>();

    for (const s of shifts) {
        const list = byUser.get(s.userId) ?? [];
        list.push(s);
        byUser.set(s.userId, list);
    }

    for (const [userId, userShifts] of byUser) {
        const sorted = [...userShifts].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

        for (let i = 0; i < sorted.length; i++) {
            const shift = sorted[i];
            const hours = hoursOf(shift);

            if (hours > config.maxDailyHours) {
                violations.push({
                    ruleId: 'max_daily_hours',
                    severity: 'blocking',
                    shiftId: shift.id,
                    userId,
                    message: `Amplitude ${hours.toFixed(1)}h dépasse le max ${config.maxDailyHours}h`,
                });
            }

            if (hours >= config.minBreakAfterHours) {
                violations.push({
                    ruleId: 'break_required',
                    severity: 'warning',
                    shiftId: shift.id,
                    userId,
                    message: `Shift de ${hours.toFixed(1)}h : pause ${config.breakDurationMinutes}min obligatoire`,
                });
            }

            if (i > 0) {
                const prev = sorted[i - 1];
                const prevEnd = parseTime(prev.date, prev.endTime);
                const currStart = parseTime(shift.date, shift.startTime);
                const restHours = (currStart - prevEnd) / (1000 * 60 * 60);

                if (restHours < config.minRestBetweenShifts) {
                    violations.push({
                        ruleId: 'min_rest',
                        severity: 'blocking',
                        shiftId: shift.id,
                        userId,
                        message: `Repos ${restHours.toFixed(1)}h < minimum ${config.minRestBetweenShifts}h`,
                    });
                }
            }
        }

        // Consecutive days check
        const dates = [...new Set(sorted.map(s => s.date))].sort();
        let consecutive = 1;
        for (let i = 1; i < dates.length; i++) {
            if (daysBetween(dates[i - 1], dates[i]) === 1) {
                consecutive++;
                if (consecutive > config.maxConsecutiveDays) {
                    violations.push({
                        ruleId: 'max_consecutive_days',
                        severity: 'blocking',
                        shiftId: sorted.find(s => s.date === dates[i])!.id,
                        userId,
                        message: `${consecutive} jours consécutifs > max ${config.maxConsecutiveDays}`,
                    });
                }
            } else {
                consecutive = 1;
            }
        }

        // Weekly hours check
        const weekMap = new Map<string, number>();
        for (const s of sorted) {
            const d = new Date(s.date);
            const monday = new Date(d);
            monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
            const weekKey = monday.toISOString().split('T')[0];
            weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + hoursOf(s));
        }
        for (const [weekKey, total] of weekMap) {
            if (total > config.maxWeeklyHours) {
                const shiftInWeek = sorted.find(s => {
                    const d = new Date(s.date);
                    const monday = new Date(d);
                    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
                    return monday.toISOString().split('T')[0] === weekKey;
                });
                violations.push({
                    ruleId: 'max_weekly_hours',
                    severity: 'blocking',
                    shiftId: shiftInWeek?.id ?? '',
                    userId,
                    message: `Semaine ${weekKey} : ${total.toFixed(1)}h > max ${config.maxWeeklyHours}h`,
                });
            }
        }
    }

    return violations;
}

export type { Shift, ComplianceViolation, HcrConfig };
