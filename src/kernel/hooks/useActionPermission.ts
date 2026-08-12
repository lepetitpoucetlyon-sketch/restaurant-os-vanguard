"use client";

import { useMemo } from "react";
import { useAuth } from "@/kernel/providers/NexusCoreContext";
import {
    PERMISSION_ROLE_LEVELS,
    type PermissionRole,
    type PermissionCheckResult,
} from "@nexus/contracts/permissions.types";
import { logger } from '@/lib/logger';

// ACTION_MAP (350L de config) extraite dans actionPermissionMap.ts
import { ACTION_MAP } from '@nexus/guards/rbac/actionPermissionMap';
export type { ActionConfig } from '@nexus/guards/rbac/actionPermissionMap';

export function useActionPermission(page: string, action: string): PermissionCheckResult {
    const { currentUser } = useAuth();

    return useMemo<PermissionCheckResult>(() => {
        // L'authentification prime sur tout le reste. Auparavant ce contrôle venait
        // APRÈS le cas « action non déclarée » : un utilisateur non authentifié était
        // donc autorisé sur toute action absente de l'ACTION_MAP.
        if (!currentUser) return { allowed: false, requiresPin: false, reason: 'Non authentifié' };

        const config = ACTION_MAP[page]?.[action];

        if (!config) {
            // Échec OUVERT — conservé temporairement pour ne pas bloquer un écran
            // s'appuyant sur une action non déclarée.
            //
            // ⚠️ PHASE 2 (chantier 16) : basculer sur un refus une fois les actions
            // manquantes relevées en production et ajoutées à ACTION_MAP.
            // `usePageAccess` et `useTabAccess` échouent déjà FERMÉ — cette
            // incohérence doit disparaître.
            logger.warn(
                `[RBAC] Action non déclarée dans ACTION_MAP : "${page}.${action}" — ` +
                `autorisée par défaut (sans PIN). À déclarer dans actionPermissionMap.ts.`
            );
            return { allowed: true, requiresPin: false };
        }

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

/**
 * @deprecated useThresholdCheck supprimé (0 consommateurs).
 * Si besoin, importer policyEngine depuis `@/modules/compliance` dans le
 * composant appelant — ne pas réintroduire d'inversion shared→modules.
 */
