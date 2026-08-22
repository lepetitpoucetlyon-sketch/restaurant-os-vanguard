 
"use client";

import { useMemo, useCallback } from "react";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import {
    PERMISSION_ROLE_LEVELS,
    type PermissionRole,
    type PermissionCheckResult,
} from "@nexus/contracts/permissions.types";
import { policyEngine } from '@/lib/permissions/PolicyEngine';

// ACTION_MAP (350L de config) extraite dans actionPermissionMap.ts
import { ACTION_MAP } from './actionPermissionMap';
export type { ActionConfig } from './actionPermissionMap';

export function useActionPermission(page: string, action: string): PermissionCheckResult {
    const { currentUser } = useAuth();

    return useMemo<PermissionCheckResult>(() => {
        const config = ACTION_MAP[page]?.[action];

        // Action non déclarée → ouverte à tout utilisateur authentifié
        if (!config) return { allowed: true, requiresPin: false };

        if (!currentUser) return { allowed: false, requiresPin: false, reason: 'Non authentifié' };

        const role = currentUser.role as PermissionRole;
        const userLevel = PERMISSION_ROLE_LEVELS[role] ?? 0;

        if (userLevel >= config.minLevel) {
            return { allowed: true, requiresPin: config.requiresPin ?? false, limit: config.limit };
        }

        return {
            allowed: false,
            requiresPin: false,
            reason: `Niveau insuffisant — rôle ${role} (${userLevel}) < ${config.minLevel} requis`,
        };
    }, [currentUser, page, action]);
}

export function useThresholdCheck(page: string, action: string) {
    const { currentUser } = useAuth();

    const checkThreshold = useCallback(
        (field: 'amount' | 'discountPct' | 'quantity', value: number) => {
            if (!currentUser) return { allowed: false, reason: 'Non authentifié', requiresElevation: false };
            const role = currentUser.role as PermissionRole;
            const fullAction = `${page}.${action}`;
            return policyEngine.checkThreshold(role, fullAction, field, value);
        },
        [currentUser, page, action]
    );

    return { checkThreshold };
}
