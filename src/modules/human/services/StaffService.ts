import { Shift, LeaveRequest } from '@nexus/contracts';
import { ShiftProvision } from '@nexus/contracts/domain.types';
import { logger } from '@/lib/logger';

/**
 * 🧑‍🍳 StaffService - Restaurant OS
 * Centralized Domain Logic for Human Resources and Compliance.
 * Grade VI: Industrialized Payroll & Shift Management.
 */
export class StaffService {

    /**
     * Calculates the estimated accounting provision for a shift.
     * Based on NF525 standards for labor cost projection.
     */
    static calculateShiftProvision(shift: Shift): ShiftProvision | null {
        if (shift.status !== 'published') return null;

        logger.debug(`[StaffService] Calculating Provision for Shift: ${shift.id}`);

        const estimatedHourlyRate = 1800; // 18.00€ Charge incl.
        
        try {
            const datePart = shift.date.split('T')[0];
            const startStr = `${datePart}T${shift.startTime}`;
            const endStr = `${datePart}T${shift.endTime}`;
            const durationMs = new Date(endStr).getTime() - new Date(startStr).getTime();
            const hours = durationMs / (1000 * 60 * 60);
            const totalCostCents = Math.round(hours * estimatedHourlyRate);

            if (totalCostCents <= 0) return null;

            return {
                pieceNumber: `PAY-EST-${Date.now()}`,
                date: new Date().toISOString(),
                description: `Provision Charge Personnel - Shift ${shift.id} (${shift.userId})`,
                status: 'draft',
                referenceId: shift.id,
                referenceType: 'payroll',
                isSystemGenerated: true,
                isValidated: false,
                lines: [
                    {
                        accountId: 'acc_641',
                        accountCode: '641',
                        accountName: 'Rémunérations du personnel',
                        description: `Estimation coût horaire (${hours.toFixed(2)}h @ 18€/h)`,
                        side: 'debit',
                        amountInCents: totalCostCents,
                        amountInMicrounits: totalCostCents * 10_000,
                    },
                    {
                        accountId: 'acc_421',
                        accountCode: '421',
                        accountName: 'Personnel - Rémunérations dues',
                        description: `Provision pour paie à venir`,
                        side: 'credit',
                        amountInCents: totalCostCents,
                        amountInMicrounits: totalCostCents * 10_000,
                    }
                ],
                metadata: {
                    userId: shift.userId,
                    hours,
                    hourlyRate: estimatedHourlyRate
                }
            };
        } catch (error) {
            logger.error(`[StaffService] Failed to calculate provision for shift ${shift.id}`, { error });
            return null;
        }
    }

    /**
     * Validates a leave request against business rules.
     */
    static validateLeaveRequest(request: Partial<LeaveRequest>): { valid: boolean; error?: string } {
        if (!request.startDate || !request.endDate) {
            return { valid: false, error: "Missing period dates." };
        }
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);

        if (end < start) {
            return { valid: false, error: "End date cannot be before start date." };
        }

        // Grade VI Rule: No leave requests for past dates (except for special cases)
        if (start < new Date() && request.type !== 'sick_leave') {
            return { valid: false, error: "Backdated leave requests are only allowed for sick leave." };
        }

        return { valid: true };
    }
}
