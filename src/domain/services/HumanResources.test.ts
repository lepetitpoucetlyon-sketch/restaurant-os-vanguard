import { describe, it, expect, vi } from 'vitest';
import { HumanResourcesService } from './HumanResources';
import { ShiftEntry } from "@domain/schemas/hr";
import { addDays } from 'date-fns';

describe('HumanResourcesService (Grade VI Validation)', () => {
    describe('calculatePayroll', () => {
        it('should calculate monthly payroll correctly with standard formula', () => {
            const result = HumanResourcesService.calculatePayroll(35, 20);
            
            // 35 * 4.33 = 151.55
            expect(result.totalHours).toBe(151.55);
            // 151.55 * 20 = 3031
            expect(result.grossAmount).toBe(3031);
            // 3031 * 0.78 = 2364.18
            expect(result.netAmount).toBe(2364.18);
            expect(result.chargesSociales).toBe(666.82);
        });
    });

    describe('getHoursForDay', () => {
        it('should calculate duration between CLOCK_IN and CLOCK_OUT', () => {
            const dayDate = new Date('2026-04-16T00:00:00Z');
            const shifts: ShiftEntry[] = [
                { id: '1', type: 'CLOCK_IN', timestamp: '2026-04-16T08:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } },
                { id: '2', type: 'CLOCK_OUT', timestamp: '2026-04-16T17:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } }
            ];

            const hours = HumanResourcesService.getHoursForDay(shifts, dayDate);
            expect(hours).toBe(9);
        });

        it('should return 0 if no shifts for the day', () => {
            const dayDate = new Date('2026-04-16T00:00:00Z');
            const hours = HumanResourcesService.getHoursForDay([], dayDate);
            expect(hours).toBe(0);
        });
    });

    describe('calculateEmployeeStats', () => {
        it('should aggregate 7 days of work and calculate overtime', () => {
            const weekStart = new Date('2026-04-13T00:00:00Z');
            const shifts: ShiftEntry[] = [
                { id: '1', type: 'CLOCK_IN', timestamp: '2026-04-13T08:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } },
                { id: '2', type: 'CLOCK_OUT', timestamp: '2026-04-13T16:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } }, // 8h
                { id: '3', type: 'CLOCK_IN', timestamp: '2026-04-14T08:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } },
                { id: '4', type: 'CLOCK_OUT', timestamp: '2026-04-14T16:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } }, // 8h
                { id: '5', type: 'CLOCK_IN', timestamp: '2026-04-15T08:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } },
                { id: '6', type: 'CLOCK_OUT', timestamp: '2026-04-15T16:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } }, // 8h
                { id: '7', type: 'CLOCK_IN', timestamp: '2026-04-16T08:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } },
                { id: '8', type: 'CLOCK_OUT', timestamp: '2026-04-16T16:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } }, // 8h
                { id: '9', type: 'CLOCK_IN', timestamp: '2026-04-17T08:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } },
                { id: '10', type: 'CLOCK_OUT', timestamp: '2026-04-17T16:00:00Z', userId: 'staff1', userName: 'Test User', location: { terminalId: 'T1' } } // 8h
            ]; // Total = 40h

            const stats = HumanResourcesService.calculateEmployeeStats(shifts, weekStart);
            expect(stats.totalHours).toBe(40);
            expect(stats.overtime).toBe(5); // 40 - 35 = 5
        });
    });
});
