import type { Policy } from '@/shared/schemas';
import { operationalFlags, type PolicyMode } from '@/config/features';
import { PERMISSION_ROLE_LEVELS, type PermissionRole } from '@/shared/nexus/contracts/permissions.types';
import { logger } from '@/lib/logger';

export interface PolicyCheckResult {
    allowed: boolean;
    reason?: string;
    requiresElevation?: boolean;
    requiredRoleLevel?: number;
}

// Default SoD matrix for procurement: reception ⊗ invoiceApproval ⊗ payment
const DEFAULT_SOD_MATRIX: Array<{ incompatibleActions: string[]; description: string }> = [
    {
        incompatibleActions: ['procurement.reception', 'procurement.invoiceApproval'],
        description: 'Le réceptionneur ne peut pas approuver la facture',
    },
    {
        incompatibleActions: ['procurement.invoiceApproval', 'procurement.payment'],
        description: "L'approbateur ne peut pas exécuter le paiement",
    },
    {
        incompatibleActions: ['procurement.reception', 'procurement.payment'],
        description: 'Le réceptionneur ne peut pas exécuter le paiement',
    },
];

export class PolicyEngine {
    private policies: Policy[] = [];

    loadPolicies(policies: Policy[]) {
        this.policies = policies.filter(p => p.enabled);
    }

    private get mode(): PolicyMode {
        return operationalFlags.policyEnforce;
    }

    checkSod(actorId: string, actorRole: PermissionRole, action: string, priorActions: Array<{ actorId: string; action: string }>): PolicyCheckResult {
        if (this.mode === 'off') return { allowed: true };

        const actorPriorActions = priorActions
            .filter(a => a.actorId === actorId)
            .map(a => a.action);

        const allSodRules = [
            ...DEFAULT_SOD_MATRIX,
            ...this.policies
                .filter(p => p.type === 'sod' && p.sodRule)
                .map(p => p.sodRule!),
        ];

        for (const rule of allSodRules) {
            if (!rule.incompatibleActions.includes(action)) continue;
            const conflictAction = rule.incompatibleActions.find(a => a !== action);
            if (conflictAction && actorPriorActions.includes(conflictAction)) {
                const reason = `SoD violation : ${rule.description || 'Actions incompatibles'} (${actorId} a déjà exécuté "${conflictAction}")`;
                if (this.mode === 'enforce') {
                    logger.warn(`[PolicyEngine] Bloqué : ${reason}`);
                    return { allowed: false, reason };
                }
                logger.warn(`[PolicyEngine] Avertissement (shadow) : ${reason}`);
            }
        }

        return { allowed: true };
    }

    checkThreshold(
        actorRole: PermissionRole,
        action: string,
        field: 'amount' | 'discountPct' | 'quantity',
        value: number
    ): PolicyCheckResult {
        if (this.mode === 'off') return { allowed: true };

        const thresholdPolicies = this.policies.filter(p => p.type === 'threshold' && p.thresholdRule);
        for (const policy of thresholdPolicies) {
            const rule = policy.thresholdRule;
            if (!rule || rule.action !== action || rule.field !== field) continue;

            const actorLevel = PERMISSION_ROLE_LEVELS[actorRole] ?? 0;
            if (actorLevel >= rule.requiredRoleLevel) {
                return { allowed: true };
            }

            if (value > rule.maxValue) {
                const reason = `Seuil dépassé pour "${action}.${field}" (${value} > ${rule.maxValue}). Rôle niveau ${rule.requiredRoleLevel} requis (actuel : ${actorLevel}).`;
                if (this.mode === 'enforce') {
                    logger.warn(`[PolicyEngine] Bloqué : ${reason}`);
                    return {
                        allowed: false,
                        reason,
                        requiresElevation: true,
                        requiredRoleLevel: rule.requiredRoleLevel,
                    };
                }
                logger.warn(`[PolicyEngine] Avertissement (shadow) : ${reason}`);
            }
        }

        return { allowed: true };
    }
}

export const policyEngine = new PolicyEngine();
