import { ShiftEntry, PayrollPeriodSchema, PayrollCalculation, ShiftStats } from "@domain/schemas/hr";
import { format, addDays, isSameDay } from 'date-fns';
import { SovereignData } from "@shared/nexus-contract";

export class HumanResourcesService {
    /**
     * Calculate monthly payroll based on weekly hours
     * Grade VI - Precision Engine
     */
    static calculatePayroll(weeklyHours: number, hourlyRate: number): PayrollCalculation {
        // Standard formula: weekly hours * 4.33 weeks/month
        const monthlyHours = weeklyHours * 4.33;
        const grossAmount = monthlyHours * hourlyRate;
        const netAmount = grossAmount * 0.78; // Approx net for France
        const chargesSociales = grossAmount - netAmount;

        return {
            totalHours: Number(monthlyHours.toFixed(2)),
            hourlyRate,
            grossAmount: Number(grossAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            chargesSociales: Number(chargesSociales.toFixed(2)),
            period: format(new Date(), 'yyyy-MM')
        };
    }

    /**
     * Calculate comprehensive statistics for an employee over a period
     * Centralized logic for the "Weaver" operation
     */
    static calculateEmployeeStats(shifts: ShiftEntry[], weekStart: Date): ShiftStats {
        let totalHours = 0;
        const _breakTime = 0;

        for (let i = 0; i < 7; i++) {
            const dayDate = addDays(weekStart, i);
            totalHours += this.getHoursForDay(shifts, dayDate);
        }

        return {
            totalHours: Number(totalHours.toFixed(2)),
            overtime: Math.max(0, totalHours - 35),
            breakTime: 0, // Logic to be implemented when BREAK events are active
            punctualityScore: 100, // Placeholder for Phase 4.2
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
