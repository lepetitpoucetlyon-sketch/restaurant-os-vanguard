        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { policyEngine } from '@/modules/compliance/services';
import { empireAudit } from '@/infrastructure/services/audit';
import type { PermissionRole } from '@nexus/contracts/permissions.types';

interface ApprovalResult {
    allowed: boolean;
    requiresElevation: boolean;
    reason?: string;
}

export const PurchaseApprovalService = {
    checkPurchaseOrder(
        role: PermissionRole,
        totalAmountCents: number
    ): ApprovalResult {
        const result = policyEngine.checkThreshold(
            role,
            'procurement.create_po',
            'amount',
            totalAmountCents
        );

        return {
            allowed: result.allowed,
            requiresElevation: result.requiresElevation ?? false,
            reason: result.reason,
        };
    },

    checkInvoiceValidation(
        role: PermissionRole,
        totalAmountCents: number
    ): ApprovalResult {
        const result = policyEngine.checkThreshold(
            role,
            'procurement.validate_invoice',
            'amount',
            totalAmountCents
        );

        return {
            allowed: result.allowed,
            requiresElevation: result.requiresElevation ?? false,
            reason: result.reason,
        };
    },

    logApproval(
        action: 'po_created' | 'invoice_validated',
        userId: string,
        amountCents: number,
        approved: boolean
    ): void {
        empireAudit.log({
            module: 'finance',
            action: `purchase_${action}`,
            userId,
            timestamp: new Date(),
            severity: approved ? 'low' : 'medium',
            details: {
                amountCents,
                approved,
            } as unknown as import('@/shared/nexus-contract').SovereignData,
        });
    },
};
