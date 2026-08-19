import { ShiftEntry, PayrollPeriodSchema } from "../domain/schemas/hr";
import { format, addDays, isSameDay } from 'date-fns';
import { SovereignData } from "@shared/nexus-contract";

export interface HumanPayrollCalculation {
    totalHours: number;
    hourlyRate: number;
    grossAmount: number;
    netAmount: number;
    chargesSociales: number;
    employerCost: number;
    period: string;
}

export interface HumanShiftStats {
    totalHours: number;
    overtime: number;
    breakTime: number;
    punctualityScore: number;
    period: string;
}

/** Scheduled shift reference used for punctuality scoring */
interface ScheduledShiftRef {
    date: string;   // ISO date string YYYY-MM-DD
    startTime: string; // HH:mm
}

export class HumanResourcesService {
    /**
     * Calculate monthly payroll based on weekly hours
     * Grade VI - Precision Engine
     * @see taux indicatifs 2024 — utiliser DSN réelle
     */
    static calculatePayroll(weeklyHours: number, hourlyRate: number): HumanPayrollCalculation {
        // Standard formula: weekly hours * 4.33 weeks/month
        const monthlyHours = weeklyHours * 4.33;
        const grossAmount = monthlyHours * hourlyRate;
        // Taux indicatifs 2024 — MSA/URSSAF selon convention collective
        // @see https://www.urssaf.fr — utiliser DSN réelle en production
        const netAmount = grossAmount * (1 - 0.22);        // charges salariales ~22%
        const chargesSociales = grossAmount - netAmount;
        const employerCost = grossAmount * 1.42;            // charges patronales ~42%

        return {
            totalHours: Number(monthlyHours.toFixed(2)),
            hourlyRate,
            grossAmount: Number(grossAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            chargesSociales: Number(chargesSociales.toFixed(2)),
            employerCost: Number(employerCost.toFixed(2)),
            period: format(new Date(), 'yyyy-MM')
        };
    }

    /**
     * Calculate comprehensive statistics for an employee over a period
     * Centralized logic for the "Weaver" operation
     */
    static calculateEmployeeStats(
        shifts: ShiftEntry[],
        weekStart: Date,
        scheduledShifts?: ScheduledShiftRef[]
    ): HumanShiftStats {
        let totalHours = 0;

        for (let i = 0; i < 7; i++) {
            const dayDate = addDays(weekStart, i);
            totalHours += this.getHoursForDay(shifts, dayDate);
        }

        // --- Break time: sum of (BREAK_END − BREAK_START) pairs ---
        const sortedEntries = [...shifts].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        let breakTimeMinutes = 0;
        const pendingBreakStarts: ShiftEntry[] = [];
        for (const entry of sortedEntries) {
            if (entry.type === 'BREAK_START') {
                pendingBreakStarts.push(entry);
            } else if (entry.type === 'BREAK_END' && pendingBreakStarts.length > 0) {
                const breakStart = pendingBreakStarts.pop()!;
                const diffMs =
                    new Date(entry.timestamp).getTime() - new Date(breakStart.timestamp).getTime();
                breakTimeMinutes += diffMs / (1000 * 60);
            }
        }

        // --- Punctuality: 100 − round(lateArrivals / totalShifts × 100) ---
        let punctualityScore = 100;
        if (scheduledShifts?.length) {
            let lateArrivals = 0;
            let totalScheduled = 0;

            for (const scheduled of scheduledShifts) {
                const [h, m] = scheduled.startTime.split(':').map(Number);
                const scheduledStart = new Date(scheduled.date);
                scheduledStart.setHours(h, m, 0, 0);
                const graceMs = 5 * 60 * 1000; // 5 minutes grace

                const dayClockIn = shifts.find(
                    (e) =>
                        e.type === 'CLOCK_IN' &&
                        isSameDay(new Date(e.timestamp), new Date(scheduled.date))
                );

                if (dayClockIn) {
                    totalScheduled++;
                    if (
                        new Date(dayClockIn.timestamp).getTime() >
                        scheduledStart.getTime() + graceMs
                    ) {
                        lateArrivals++;
                    }
                }
            }

            if (totalScheduled > 0) {
                punctualityScore = 100 - Math.round((lateArrivals / totalScheduled) * 100);
            }
        }

        return {
            totalHours: Number(totalHours.toFixed(2)),
            overtime: Math.max(0, totalHours - 35),
            breakTime: Math.round(breakTimeMinutes),
            punctualityScore,
            period: format(weekStart, 'yyyy-MM-dd')
        };
    }

    /**
     * Get hours worked for a specific day from ShiftEntry array
     */
    static getHoursForDay(shifts: ShiftEntry[], dayDate: Date): number {
        // Simple logic for Phase 4: Calculate duration between first CLOCK_IN and last CLOCK_OUT of the day
        const dayShifts = shifts.filter(s => isSameDay(new Date(s.timestamp), dayDate));
        
        if (dayShifts.length === 0) return 0;

        // Note: In a production Grade VI system, we would handle multiple shift pairs.
        // For now, we take the span between the earliest and latest event.
        const sorted = [...dayShifts].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        if (first.type === 'CLOCK_IN' && last.type === 'CLOCK_OUT') {
            const diffMs = new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime();
            return diffMs / (1000 * 60 * 60);
        }

        return 0;
    }

    /**
     * Calculate total hours for a week (legacy wrapper for compatibility)
     */
    static calculateWeeklyHours(shifts: ShiftEntry[], weekStart: Date): number {
        return this.calculateEmployeeStats(shifts, weekStart).totalHours;
    }

    /**
     * Validate a payroll entry before accounting injection
     */
    static validatePayroll(data: SovereignData) {
        return PayrollPeriodSchema.parse(data);
    }
}
