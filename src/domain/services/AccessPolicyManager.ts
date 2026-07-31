import type { User, UserRole } from '@nexus/contracts';

/**
 * Grade VIII - Agnostic Access Management
 * No business-specific categories are defined here.
 * Core categories are limited to infrastructure.
 */
export const CORE_CATEGORIES = ['dashboard', 'account-settings', 'settings'] as const;

export const ALL_CATEGORIES = [
    'dashboard', 'account-settings', 'settings', 'operations', 
    'hr', 'marketing', 'finance', 'inventory', 'quality', 'delivery'
] as const;

export type CategoryKey = string; // Generic string for dynamic injection
export type RolePermissions = Record<UserRole | string, CategoryKey[]>;

import { SovereignValue, SovereignData } from '@/shared/nexus-contract';

/**
 * AccessPolicyManager
 * Universal policy engine for a multi-tenant platform.
 */
function normalizeCategoryList(categories: SovereignValue[]): CategoryKey[] {
    if (!Array.isArray(categories)) {
        return [];
    }
    return categories.filter(c => typeof c === 'string') as CategoryKey[];
}

function sanitizeRolePermissions(value: SovereignData, defaultPermissions: RolePermissions): RolePermissions {
    const merged = { ...defaultPermissions };
    const candidate = value || {};

    for (const role of Object.keys(defaultPermissions)) {
        const normalized = normalizeCategoryList(candidate[role] as SovereignValue[]);
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
    const userLevel = user.accessLevel || 0;
    const requiredLevel = actionPermissions[action] || 0;
    
    return userLevel >= requiredLevel;
}


function canAccessDocument(user: User | null, documentOwnerId: string): boolean {
    if (!user) return false;
    // Social Shield: Un utilisateur RESTRICTED ne peut accéder qu'à ses documents personnels
    if (user.status === 'RESTRICTED') {
        return user.id === documentOwnerId;
    }
    // Admin has super-user bypass
    if (user.role === 'admin') return true;
    return true; // For ACTIVE users
}

export const AccessPolicyManager = {
    canAccessDocument,
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

export const ROLE_LABELS: Record<string, string> = {
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
    cashier: "Caisse",
    fleet_admin: "Opérateur Flotte",
    SUPER_ADMIN: "Super Admin",
    mcc_junior_dev: "Développeur MCC",
    mcc_support: "Support MCC",
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
    quality: "HACCP & Qualité",
    delivery: "Agrégateurs & Livraison"
};

export const CATEGORY_FEATURES: Record<string, { id: string; label: string; description?: string }[]> = {
    operations: [
        { id: 'operations.pos.offer', label: 'Offrir des produits (Gratuité)', description: 'Autorise l\'employé à appliquer une remise de 100% sur un article.' },
        { id: 'operations.pos.cancel_sent', label: 'Annuler un plat préparé', description: 'Autorise l\'annulation d\'un article déjà envoyé en cuisine.' },
        { id: 'operations.pos.open_drawer', label: 'Ouvrir le tiroir-caisse', description: 'Autorise l\'ouverture manuelle du tiroir-caisse sans transaction.' },
        { id: 'operations.pos.discount', label: 'Appliquer une remise', description: 'Autorise l\'application de remises personnalisées sur l\'addition.' },
        { id: 'operations.pos.custom_price', label: 'Touche Prix Libre', description: 'Autorise la saisie d\'un prix manuellement hors catalogue.' },
        { id: 'operations.pos.transfer_item', label: 'Transférer un article', description: 'Autorise le transfert d\'un seul plat/verre vers une autre table.' },
        { id: 'operations.pos.reopen_ticket', label: 'Rouvrir un ticket encaissé', description: 'Autorise la réouverture d\'un ticket pour corriger le moyen de paiement (Sensible).' },
        { id: 'operations.pos.vip_comp', label: 'Tarif Staff / VIP', description: 'Autorise l\'application du badge de remise globale Famille/Staff.' },
        { id: 'operations.pos.tips_adjust', label: 'Ajustement Pourboire', description: 'Autorise la saisie d\'un pourboire manuellement sur le TPE.' },
        { id: 'operations.pos.void_ticket', label: 'Annuler un ticket entier', description: 'Autorise l\'annulation complète d\'une commande avant encaissement.' },
        { id: 'operations.table.block', label: 'Condamner une table', description: 'Autorise à marquer une table comme bloquée sur le plan de salle.' },
        { id: 'operations.kds.unbump', label: 'Rappeler un ticket Cuisine', description: 'Autorise à reprendre un bon validé par erreur sur l\'écran KDS.' }
    ],
    finance: [
        { id: 'finance.refund', label: 'Rembourser un client', description: 'Autorise le déclenchement d\'un remboursement après encaissement.' },
        { id: 'finance.view_margins', label: 'Voir les marges (Food Cost)', description: 'Autorise l\'affichage des marges et coûts de revient.' },
        { id: 'finance.safe_drop', label: 'Dépôt Coffre', description: 'Autorise le transfert du surplus de cash vers le coffre-fort.' },
        { id: 'finance.shift_report', label: 'Rapport de Shift (X)', description: 'Autorise la clôture de fin de service (midi/soir) sans clôturer la journée.' },
        { id: 'finance.tip_payout', label: 'Décaissement Pourboires', description: 'Autorise la sortie de liquide pour distribuer les pourboires au staff.' },
        { id: 'finance.export_fec', label: 'Export Comptable (FEC)', description: 'Autorise l\'envoi des données à l\'expert-comptable.' },
        { id: 'finance.petty_cash', label: 'Sortir du liquide (Fond de caisse)', description: 'Autorise les mouvements de caisse.' }
    ],
    inventory: [
        { id: 'inventory.stock.adjust', label: 'Ajustement de stock', description: 'Autorise la modification manuelle des quantités en stock.' },
        { id: 'inventory.recipe.edit', label: 'Modifier les recettes', description: 'Autorise la création ou modification des fiches techniques.' },
        { id: 'inventory.waste.declare', label: 'Déclarer de la Perte', description: 'Autorise la déclaration de casse ou de péremption.' },
        { id: 'inventory.transfer.location', label: 'Transfert Multi-Zones', description: 'Autorise le transfert de stock entre différentes zones (ex: Cave vers Bar).' },
        { id: 'inventory.cost.view', label: 'Voir les Prix d\'Achat', description: 'Autorise l\'affichage des prix fournisseurs et coûts unitaires.' },
        { id: 'inventory.alerts.manage', label: 'Paramétrer les alertes', description: 'Autorise la configuration des seuils d\'alerte de rupture.' }
    ],
    hr: [
        { id: 'hr.planning.edit', label: 'Modifier le planning', description: 'Autorise la modification des horaires de la brigade.' },
        { id: 'hr.planning.view_all', label: 'Voir le planning de tous', description: 'Autorise la vue du planning de tous les employés.' },
        { id: 'hr.salary.view', label: 'Voir les salaires', description: 'Autorise l\'accès aux données de rémunération.' },
        { id: 'hr.cash_advance', label: 'Avance sur Salaire', description: 'Autorise la sortie de cash de la caisse pour une avance employé.' },
        { id: 'hr.time_tracking.edit', label: 'Modifier les pointages', description: 'Autorise la correction manuelle des heures travaillées.' },
        { id: 'hr.roles.bypass_mfa', label: 'Bypass MFA', description: 'Autorise la désactivation de la double authentification pour un employé.' }
    ],
    quality: [
        { id: 'quality.haccp.override', label: 'Forcer un relevé HACCP', description: 'Autorise la validation manuelle d\'un contrôle de température échoué.' },
        { id: 'quality.haccp.delete_log', label: 'Supprimer un relevé HACCP', description: 'Autorise la suppression d\'un relevé d\'hygiène (Réservé Direction).' }
    ],
    marketing: [
        { id: 'marketing.giftcard.issue', label: 'Émettre une Carte Cadeau', description: 'Autorise la création et le chargement de cartes cadeaux.' },
        { id: 'marketing.giftcard.refund', label: 'Rembourser Carte Cadeau', description: 'Autorise le remboursement d\'une carte cadeau en monnaie.' },
        { id: 'marketing.crm.export', label: 'Exporter la base Clients', description: 'Autorise l\'exportation CSV des données clients (RGPD).' },
        { id: 'marketing.loyalty.adjust', label: 'Modifier les points Fidélité', description: 'Autorise l\'ajustement manuel du solde de points d\'un client.' }
    ],
    dashboard: [
        { id: 'dashboard.view_revenue', label: 'Voir le CA', description: 'Autorise la vue sur le chiffre d\'affaires en temps réel.' },
        { id: 'dashboard.export_data', label: 'Exporter les rapports', description: 'Autorise le téléchargement des données du tableau de bord.' }
    ],
    settings: [
        { id: 'settings.edit_restaurant_info', label: 'Infos Légales', description: 'Autorise la modification du SIRET et de l\'adresse.' },
        { id: 'settings.manage_hardware', label: 'Gérer le Matériel', description: 'Autorise la configuration des imprimantes et TPE.' },
        { id: 'settings.manage_taxes', label: 'Gérer la TVA', description: 'Autorise la modification des taux de TVA.' }
    ],
    "account-settings": [
        { id: 'account-settings.reset_passwords', label: 'Réinitialiser les codes PIN', description: 'Autorise la réinitialisation des mots de passe des employés.' }
    ],
    delivery: [
        { id: 'delivery.manage_platforms', label: 'Gérer les Plateformes', description: 'Autorise l\'activation et désactivation d\'UberEats/Deliveroo.' },
        { id: 'delivery.push_menu', label: 'Forcer synchro Menu', description: 'Autorise le renvoi manuel de la carte complète aux agrégateurs.' },
        { id: 'delivery.toggle_rush_mode', label: 'Mode Rush (Pause Plateformes)', description: 'Autorise la suspension des commandes externes en cas de forte affluence.' }
    ]
};
