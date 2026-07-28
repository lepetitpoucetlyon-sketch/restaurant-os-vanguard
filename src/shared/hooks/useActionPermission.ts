"use client";

import { useMemo, useCallback } from "react";
import { useAuth } from "@/shared/providers/NexusCoreProvider";
import {
    PERMISSION_ROLE_LEVELS,
    type PermissionRole,
    type PermissionCheckResult,
} from "@nexus/contracts/permissions.types";
import { policyEngine } from "@/modules/compliance/services/PolicyEngine";

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
    haccp: {
        // Traçabilité sanitaire — CE 852/2004 & CE 178/2002
        validate_control:      { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        close_nonconformity:   { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: false },
        export_pms:            { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: false },
        delete_lot:            { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: true },
    },
    kds: {
        recall_order:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        force_bump:            { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        // Contournement d'un allergène signalé — sécurité alimentaire, PIN obligatoire
        override_allergen:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
    },
    crm: {
        // Données personnelles — RGPD : export & suppression sous PIN
        export_customers:      { minLevel: PERMISSION_ROLE_LEVELS.manager, requiresPin: true },
        delete_customer:       { minLevel: PERMISSION_ROLE_LEVELS.manager, requiresPin: true },
        send_campaign:         { minLevel: PERMISSION_ROLE_LEVELS.manager, requiresPin: false },
        edit_consent:          { minLevel: PERMISSION_ROLE_LEVELS.manager, requiresPin: false },
    },
    kitchen: {
        edit_recipe:           { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        // Marge = donnée financière sensible
        edit_margin:           { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: true },
        delete_product:        { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: false },
    },
    bar: {
        edit_cocktail:         { minLevel: PERMISSION_ROLE_LEVELS.barman,    requiresPin: false },
        adjust_cellar:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    marketing: {
        publish_campaign:      { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        edit_seo:              { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        send_quote:            { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    analytics: {
        trigger_vision_analysis: { minLevel: PERMISSION_ROLE_LEVELS.manager, requiresPin: false },
    },
    registre: {
        close_intervention:    { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        // DUERP = document légal obligatoire (Code du travail R.4121-1)
        edit_duerp:            { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
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
