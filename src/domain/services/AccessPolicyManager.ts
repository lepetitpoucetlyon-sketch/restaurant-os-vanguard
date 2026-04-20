import type { User, UserRole } from '@/types';

/**
 * Grade VIII - Agnostic Access Management
 * No business-specific categories are defined here.
 * Core categories are limited to infrastructure.
 */
export const CORE_CATEGORIES = ['dashboard', 'account-settings', 'settings'] as const;

export const ALL_CATEGORIES = [
    'dashboard', 'account-settings', 'settings', 'operations', 
    'hr', 'marketing', 'finance', 'inventory', 'quality'
] as const;

export type CategoryKey = string; // Generic string for dynamic injection
export type RolePermissions = Record<UserRole | string, CategoryKey[]>;

/**
 * AccessPolicyManager
 * Universal policy engine for a multi-tenant platform.
 */
function normalizeCategoryList(categories: unknown): CategoryKey[] {
    if (!Array.isArray(categories)) {
        return [];
    }
    return categories.filter(c => typeof c === 'string') as CategoryKey[];
}

function sanitizeRolePermissions(value: unknown, defaultPermissions: RolePermissions): RolePermissions {
    const merged = { ...defaultPermissions };
    const candidate = typeof value === 'object' && value !== null
        ? value as Partial<Record<string, unknown>>
        : {};

    for (const role of Object.keys(defaultPermissions)) {
        const normalized = normalizeCategoryList(candidate[role]);
        if (normalized.length > 0) {
            merged[role] = normalized;
        }
    }

    return merged;
}

function getAccessibleCategories(user: User | null, rolePermissions: RolePermissions): CategoryKey[] {
    if (!user) {
        return [];
    }
    return rolePermissions[user.role] || [];
}

function hasAccess(user: User | null, rolePermissions: RolePermissions, category: CategoryKey): boolean {
    if (!user) return false;
    // Admin has super-user bypass
    if (user.role === 'admin') return true;
    
    return getAccessibleCategories(user, rolePermissions).includes(category);
}

function canDo(user: User | null, action: string, actionPermissions: Record<string, number>): boolean {
    if (!user) {
        return false;
    }

    if (user.role === 'admin') {
        return true;
    }

    // Level-based check
    const userLevel = (user as any).clearanceLevel || 0;
    const requiredLevel = actionPermissions[action] || 0;
    
    return userLevel >= requiredLevel;
}

export const AccessPolicyManager = {
    normalizeCategoryList,
    sanitizeRolePermissions,
    getAccessibleCategories,
    hasAccess,
    canDo,
};

// Default empty permissions for a pure shell
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
    admin: ['dashboard', 'account-settings', 'settings'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
    admin: "Souverain (Admin)",
    manager: "Directeur de Salle",
    server: "Brigade de Service",
    kitchen: "Chef de Cuisine",
    "kds-view": "Écran KDS",
    "pos-standard": "Serveur Junior",
    "guest-view": "Convive (Table)",
    floor_manager: "Chef de Rang",
    kitchen_chef: "Chef de Cuisine (Métier)",
    kitchen_line: "Commis / Partie",
    bartender: "Barman / Mixologue",
    host: "Hôte d'Accueil",
    cashier: "Caisse"
};

export const CATEGORY_LABELS: Record<string, string> = {
    dashboard: "Tableau de Bord",
    "account-settings": "Comptes & Utilisateurs",
    settings: "Configuration Empire",
    operations: "Forge Opérationnelle",
    hr: "Gestion Humaine",
    marketing: "Intelligence Client",
    finance: "Flux Bancaires",
    inventory: "Stocks & Recettes",
    quality: "HACCP & Qualité"
};
