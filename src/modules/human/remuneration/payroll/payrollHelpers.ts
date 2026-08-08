import type { ICollectiveAgreement } from '../../conventions/types';
import { HCR_CONVENTION } from '../../conventions/hcr.convention';

export const MU_TO_EUR = 1_000_000;

export const FR_PUBLIC_HOLIDAYS = new Set([
    '2025-01-01','2025-04-21','2025-05-01','2025-05-08','2025-05-29',
    '2025-06-09','2025-07-14','2025-08-15','2025-11-01','2025-11-11','2025-12-25',
    '2026-01-01','2026-04-06','2026-05-01','2026-05-08','2026-05-14',
    '2026-05-25','2026-07-14','2026-08-15','2026-11-01','2026-11-11','2026-12-25',
    '2027-01-01','2027-03-29','2027-05-01','2027-05-08','2027-05-06',
    '2027-05-17','2027-07-14','2027-08-15','2027-11-01','2027-11-11','2027-12-25',
]);

export interface ShiftEntry {
    userId: string;
    type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
    timestamp: string;
}

export interface LeaveRequest {
    userId: string;
    status: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    type: string;
}

export function mergeBreaks(
    breaks: Array<{ start: number; end: number }>,
): Array<{ start: number; end: number }> {
    const sorted = [...breaks].sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];
    for (const b of sorted) {
        const last = merged[merged.length - 1];
        if (last && b.start <= last.end) {
            last.end = Math.max(last.end, b.end);
        } else {
            merged.push({ ...b });
        }
    }
    return merged;
}

export function splitName(fullName: string | undefined): { nom: string; prenom: string } {
    const parts = (fullName ?? '').split(' ');
    return { nom: parts[0] ?? '', prenom: parts.slice(1).join(' ') };
}

export function isoWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().slice(0, 10);
}

export function toDateStr(ts: string): string {
    return ts.slice(0, 10);
}

export function isSunday(ts: string): boolean {
    return new Date(ts).getUTCDay() === 0;
}

export function isPublicHoliday(ts: string): boolean {
    return FR_PUBLIC_HOLIDAYS.has(toDateStr(ts));
}

export function isNightHour(ts: string, nightStartHour: number = HCR_CONVENTION.nightStartHour): boolean {
    return new Date(ts).getUTCHours() >= nightStartHour;
}

export function analyseSession(
    clockIn: number,
    clockOut: number,
    breaks: Array<{ start: number; end: number }>,
    convention: ICollectiveAgreement = HCR_CONVENTION,
): {
    netMinutes: number;
    nightMinutes: number;
    sundayMinutes: number;
    holidayMinutes: number;
    mealCount: number;
} {
    const merged = mergeBreaks(breaks);

    let netMinutes = 0;
    let nightMinutes = 0;
    let sundayMinutes = 0;
    let holidayMinutes = 0;
    let mealCount = 0;

    const TICK = 60_000;
    let t = clockIn;
    let breakIdx = 0;

    while (t < clockOut) {
        while (breakIdx < merged.length && t >= merged[breakIdx].start) {
            if (t < merged[breakIdx].end) {
                t = merged[breakIdx].end;
                if (t >= clockOut) break;
            }
            breakIdx++;
        }
        if (t >= clockOut) break;

        const minuteTs = new Date(t).toISOString();
        netMinutes++;
        if (isNightHour(minuteTs, convention.nightStartHour)) nightMinutes++;
        if (isSunday(minuteTs)) sundayMinutes++;
        if (isPublicHoliday(minuteTs)) holidayMinutes++;

        t += TICK;
    }

    mealCount = Number(netMinutes >= 300);

    return { netMinutes, nightMinutes, sundayMinutes, holidayMinutes, mealCount };
}

export function weeklyOvertimeBreakdown(
    weekMinutes: Map<string, number>,
    convention: ICollectiveAgreement = HCR_CONVENTION,
): {
    normal: number;
    ot25: number;
    ot50: number;
} {
    let normal = 0;
    let ot25 = 0;
    let ot50 = 0;
    const normalWeekMinutes = convention.normalWeeklyHours * 60;
    const ot25BandMinutes = convention.ot25ThresholdHours * 60;

    for (const minutes of weekMinutes.values()) {
        if (minutes <= normalWeekMinutes) {
            normal += minutes;
        } else {
            normal += normalWeekMinutes;
            const ot = minutes - normalWeekMinutes;
            if (ot <= ot25BandMinutes) {
                ot25 += ot;
            } else {
                ot25 += ot25BandMinutes;
                ot50 += ot - ot25BandMinutes;
            }
        }
    }

    return { normal, ot25, ot50 };
}

export function computeGross(
    normalMinutes: number,
    ot25Minutes: number,
    ot50Minutes: number,
    rateEur: number,
    _convention: ICollectiveAgreement = HCR_CONVENTION,
): number {
    const ratePerMin = rateEur / 60;
    return (
        normalMinutes * ratePerMin +
        ot25Minutes * ratePerMin * 1.25 +
        ot50Minutes * ratePerMin * 1.50
    );
}

export function extractLeaveDays(
    leaves: LeaveRequest[],
    userId: string,
    types: string[],
    startTs: number,
    endTs: number,
): number {
    return leaves
        .filter(lr => lr.userId === userId && types.includes(lr.type))
        .reduce((sum, lr) => {
            const lrStart = new Date(lr.startDate).getTime();
            const lrEnd   = new Date(lr.endDate).getTime();
            return sum + (lrStart <= endTs && lrEnd >= startTs ? (lr.workingDays ?? 0) : 0);
        }, 0);
}
