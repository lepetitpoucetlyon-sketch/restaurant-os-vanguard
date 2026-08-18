import type { Shift } from "./shiftTypes";

export interface LegalWarning {
    label: string;
}

export const ZONES = [
    { id: "main", name: "Salle Principale" },
    { id: "terrace", name: "Terrasse" },
    { id: "vip", name: "Carré VIP" },
    { id: "bar", name: "Bar" },
];

export function parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

export function shiftDurationHours(startTime: string, endTime: string): number {
    let diff = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
    if (diff < 0) diff += 24 * 60;
    return diff / 60;
}

export function computeLegalWarnings(
    startTime: string,
    endTime: string,
    date: Date,
    otherShifts: Shift[]
): LegalWarning[] {
    const warnings: LegalWarning[] = [];
    const duration = shiftDurationHours(startTime, endTime);

    // 1. Excessive duration
    if (duration > 10) {
        warnings.push({ label: `Durée excessive (${duration.toFixed(1)}h > 10h max)` });
    }

    // 2. Rest between shifts
    const [sh, sm] = startTime.split(":").map(Number);
    const thisStart = new Date(date);
    thisStart.setHours(sh, sm, 0, 0);

    for (const s of otherShifts) {
        const sDate = new Date(s.date);
        const [eh, em] = s.endTime.split(":").map(Number);
        const prevEnd = new Date(sDate);
        prevEnd.setHours(eh, em, 0, 0);

        if (prevEnd < thisStart) {
            const restH = (thisStart.getTime() - prevEnd.getTime()) / (1000 * 3600);
            if (restH < 11) {
                warnings.push({
                    label: `Repos insuffisant (${restH.toFixed(1)}h < 11h min)`,
                });
            }
        }
    }

    // 3. Weekly total > 48h
    const weekStart = new Date(date);
    const dow = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - ((dow + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let weeklyHours = duration;
    for (const s of otherShifts) {
        const sDate = new Date(s.date);
        if (sDate >= weekStart && sDate < weekEnd) {
            weeklyHours += shiftDurationHours(s.startTime, s.endTime);
        }
    }
    if (weeklyHours > 48) {
        warnings.push({
            label: `Dépassement hebdomadaire (${weeklyHours.toFixed(1)}h > 48h max)`,
        });
    }

    return warnings;
}
