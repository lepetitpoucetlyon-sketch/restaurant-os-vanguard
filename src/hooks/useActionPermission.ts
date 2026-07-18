"use client";

import { useMemo } from "react";
import { useAuth } from "@/engines/core/NexusCoreProvider";
import {
    PERMISSION_ROLE_LEVELS,
    type PermissionRole,
    type PermissionCheckResult,
} from "@nexus/contracts/permissions.types";

type ActionConfig = {
    minLevel: number;
    requiresPin?: boolean;
    limit?: number | string;
};

const ACTION_MAP: Record<string, Record<string, ActionConfig>> = {
    pos: {
        refund:                { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        apply_discount_percent:{ minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        apply_discount_amount: { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        cancel_item_sent:      { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        cancel_order:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        offer_product:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        modify_price:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        close_register:        { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        open_drawer:           { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    finance: {
        close_period:          { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        bank_reconciliation:   { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        cancel_invoice:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        export:                { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
    },
    staff: {
        modify_salary:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        delete_employee:       { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        assign_role:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        modify_employee:       { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    reservations: {
        override_capacity:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        cancel_reservation:    { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    inventory: {
        physical_inventory:    { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        physical_count:        { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        delete_item:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        adjust_stock:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
};

export function useActionPermission(page: string, action: string): PermissionCheckResult {
    const { currentUser } = useAuth();

    return useMemo<PermissionCheckResult>(() => {
        const config = ACTION_MAP[page]?.[action];

        // Action not declared → open to all authenticated users
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
