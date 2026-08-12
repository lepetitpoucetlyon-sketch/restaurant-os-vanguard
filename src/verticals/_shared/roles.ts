/**
 * Resolver centralisé des rôles par verticale.
 * Source unique de vérité pour afficher les libellés et les suggestions
 * de rôles dans QuickAddStaffModal, RolesPermissionsPanel, MCC users/role.
 *
 * Seuls les LIBELLÉS changent — les NIVEAUX numériques de PERMISSION_ROLE_LEVELS
 * sont universels et ne varient jamais d'une verticale à l'autre.
 */
import type { PlatformVariant } from '@nexus/contracts';
import * as restaurant from '@/verticals/restaurant/roles';
import * as hotel      from '@/verticals/hotel/roles';
import * as bakery     from '@/verticals/bakery/roles';
import * as garage     from '@/verticals/garage/roles';
import * as salon      from '@/verticals/salon/roles';
import * as clinic     from '@/verticals/clinic/roles';
import * as retail     from '@/verticals/retail/roles';

const REGISTRY: Record<PlatformVariant, {
    roleLabels: Record<number, string>;
    roleSuggestions: { value: string; label: string }[];
    tipWeightsByLevel: { level: number; weight: number }[];
}> = {
    restaurant,
    hotel,
    bakery,
    garage,
    salon,
    clinic,
    retail,
    custom: restaurant, // Fallback sur restaurant
};

/** Retourne les libellés de rôles RBAC (niveau → label) pour la verticale active. */
export function resolveRoleLabels(variant: PlatformVariant = 'restaurant'): Record<number, string> {
    return REGISTRY[variant]?.roleLabels ?? restaurant.roleLabels;
}

/** Retourne les suggestions pour QuickAddStaffModal / selects de rôles. */
export function resolveRoleSuggestions(variant: PlatformVariant = 'restaurant'): { value: string; label: string }[] {
    return REGISTRY[variant]?.roleSuggestions ?? restaurant.roleSuggestions;
}

/** Retourne les poids de pourboire par niveau RBAC pour la verticale active. */
export function resolveTipWeightsByLevel(variant: PlatformVariant = 'restaurant'): { level: number; weight: number }[] {
    return REGISTRY[variant]?.tipWeightsByLevel ?? restaurant.tipWeightsByLevel;
}

/** Retourne le label d'un niveau RBAC pour la verticale active, ou le niveau brut en fallback. */
export function labelForLevel(level: number, variant: PlatformVariant = 'restaurant'): string {
    return resolveRoleLabels(variant)[level] ?? String(level);
}
