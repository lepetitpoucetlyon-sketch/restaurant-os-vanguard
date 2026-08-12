import type { Policy, ThresholdRule } from '../domain/schemas/policy';
import { operationalFlags, type PolicyMode } from '@/config/features';
import { PERMISSION_ROLE_LEVELS, type PermissionRole } from '@nexus/contracts/permissions.types';
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

        // Check custom SoD policies
        const sodPolicies = this.policies.filter(p => p.type === 'sod' && p.sodRule);
        const allRules = [
            ...sodPolicies.map(p => p.sodRule!),
            ...DEFAULT_SOD_MATRIX,
        ];

        for (const rule of allRules) {
            if (!rule.incompatibleActions.includes(action)) continue;
            const conflict = rule.incompatibleActions.find(
                a => a !== action && actorPriorActions.includes(a)
            );
            if (conflict) {
                const msg = `SoD violation: ${actorRole} (${actorId}) cannot perform "${action}" — already did "${conflict}". ${rule.description ?? ''}`;
                if (this.mode === 'warn') {
                    logger.warn(`[PolicyEngine] ${msg}`);
                    return { allowed: true, reason: msg };
                }
                return { allowed: false, reason: msg };
            }
        }

        return { allowed: true };
    }

    checkThreshold(actorRole: PermissionRole, action: string, field: 'amount' | 'discountPct' | 'quantity', value: number): PolicyCheckResult {
        if (this.mode === 'off') return { allowed: true };

        const actorLevel = PERMISSION_ROLE_LEVELS[actorRole] ?? 0;

        // Check custom threshold policies
        const thresholdPolicies = this.policies
            .filter(p => p.type === 'threshold' && p.thresholdRule)
            .map(p => p.thresholdRule!);

        for (const rule of thresholdPolicies) {
            if (rule.action !== action || rule.field !== field) continue;
            if (value > rule.maxValue && actorLevel < rule.requiredRoleLevel) {
                const msg = `Seuil dépassé: ${field}=${value} > max ${rule.maxValue}, rôle ${actorRole} (lvl ${actorLevel}) < requis (lvl ${rule.requiredRoleLevel})`;
                if (this.mode === 'warn') {
                    logger.warn(`[PolicyEngine] ${msg}`);
                    return { allowed: true, reason: msg, requiresElevation: true, requiredRoleLevel: rule.requiredRoleLevel };
                }
                return { allowed: false, reason: msg, requiresElevation: true, requiredRoleLevel: rule.requiredRoleLevel };
            }
        }

        return { allowed: true };
    }

    getApplicableThresholds(action: string): ThresholdRule[] {
        return this.policies
            .filter(p => p.type === 'threshold' && p.thresholdRule?.action === action)
            .map(p => p.thresholdRule!);
    }
}

export const policyEngine = new PolicyEngine();
