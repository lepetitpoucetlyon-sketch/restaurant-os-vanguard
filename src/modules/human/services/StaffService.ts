import type { Shift, LeaveRequest } from '@nexus/contracts';
import type { ShiftProvision } from '@nexus/contracts/domain.types';
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

            const isContractor = shift.metadata?.isContractor === true || shift.metadata?.employmentStatus === 'contractor' || shift.metadata?.contractType === 'freelance';
            const debitAccountCode = isContractor ? '611' : '641';
            const debitAccountName = isContractor ? 'Sous-traitance générale' : 'Rémunérations du personnel';
            const creditAccountCode = isContractor ? '401' : '421';
            const creditAccountName = isContractor ? 'Fournisseurs - Prestataires divers' : 'Personnel - Rémunérations dues';
            const descriptionPrefix = isContractor ? 'Provision Sous-traitance Freelance' : 'Provision Charge Personnel';

            return {
                pieceNumber: `PAY-EST-${Date.now()}`,
                date: new Date().toISOString(),
                description: `${descriptionPrefix} - Shift ${shift.id} (${shift.userId})`,
                status: 'draft',
                referenceId: shift.id,
                referenceType: 'payroll',
                isSystemGenerated: true,
                isValidated: false,
                lines: [
                    {
                        accountId: `acc_${debitAccountCode}`,
                        accountCode: debitAccountCode,
                        accountName: debitAccountName,
                        description: `Estimation coût horaire (${hours.toFixed(2)}h @ 18€/h)`,
                        side: 'debit',
                        amountInCents: totalCostCents,
                        amountInMicrounits: totalCostCents * 10_000,
                    },
                    {
                        accountId: `acc_${creditAccountCode}`,
                        accountCode: creditAccountCode,
                        accountName: creditAccountName,
                        description: `Provision pour règlement à venir`,
                        side: 'credit',
                        amountInCents: totalCostCents,
                        amountInMicrounits: totalCostCents * 10_000,
                    }
                ],
                metadata: {
                    userId: shift.userId,
                    hours,
                    hourlyRate: estimatedHourlyRate,
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
