/**
 * PERMISSIONS TYPES — Rôles et actions tenant
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  SÉPARATION STRICTE : TENANT RBAC ≠ MCC SUPER ADMIN               ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Ce fichier définit UNIQUEMENT les rôles des EMPLOYÉS d'un         ║
 * ║  établissement client (tenant). Les niveaux vont de 10 à 100.      ║
 * ║                                                                    ║
 * ║  Le constructeur de la plateforme (super admin MCC) N'EST PAS      ║
 * ║  représenté ici. Il opère via :                                    ║
 * ║    - isMCCMode() + FLEET_OPERATOR (src/config/instance.ts)         ║
 * ║    - Routes dédiées /app/(admin)/                                  ║
 * ║    - MccOperatorContract (src/lib/mcc/auth/MccOperatorContract.ts) ║
 * ║    - SovereignGuard bloque tout accès cross-tenant                 ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ============ RÔLES TENANT (employés de l'établissement) ============

/**
 * Rôles tenant — 14 niveaux de 10 à 100.
 * Libellés métier configurables par verticale via roleLabels (src/verticals/<v>/roles.ts).
 * Les niveaux numériques sont INVARIANTS ; seuls les libellés changent par verticale.
 */
export type PermissionRole =
    | 'proprietaire'    // 100 — Propriétaire de l'établissement
    | 'directeur'       //  80 — Directeur
    | 'manager'         //  70 — Manager / Chef de salle
    | 'chef_cuisinier'  //  70 — Chef de cuisine (même niveau que manager)
    | 'sous_chef'       //  60 — Sous-chef / Manager de service
    | 'comptable'       //  60 — Comptable (même niveau que sous_chef)
    | 'sommelier'       //  50 — Sommelier / Expert produit
    | 'chef_rang'       //  40 — Chef de rang
    | 'serveur'         //  30 — Serveur(se)
    | 'barman'          //  30 — Barman (même niveau que serveur)
    | 'hotesse'         //  30 — Hôte(sse) d'accueil (même niveau)
    | 'cuisinier'       //  30 — Cuisinier (même niveau que serveur)
    | 'commis'          //  20 — Commis / Serveur junior / Runner
    | 'plongeur';       //  10 — Plongeur / Apprenti

/** Libellés par défaut — surchargés par roleLabels de chaque verticale. */
export const PERMISSION_ROLE_LABELS: Record<PermissionRole, string> = {
    proprietaire:   'Propriétaire',
    directeur:      'Directeur',
    manager:        'Manager',
    chef_cuisinier: 'Chef Cuisinier',
    sous_chef:      'Sous-Chef',
    comptable:      'Comptable',
    sommelier:      'Sommelier',
    chef_rang:      'Chef de Rang',
    serveur:        'Serveur(se)',
    barman:         'Barman',
    hotesse:        'Hôtesse',
    cuisinier:      'Cuisinier',
    commis:         'Commis',
    plongeur:       'Plongeur',
};

/**
 * Niveaux numériques IMMUABLES des rôles tenant.
 * Échelle : 10 · 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
 *
 * ⚠️  NE PAS ajouter de niveau 90 ni de rôle 'super_admin' ici.
 *     Le niveau 90 n'existe plus. L'ancienne confusion super_admin = MCC est résolue.
 *
 * ──────────────────────────────────────────────────────────────────────
 * SÉMANTIQUE DU NIVEAU 100 (proprietaire) — COUCHE GÉNÉRALISTE
 * ──────────────────────────────────────────────────────────────────────
 * • Le proprietaire (100) est le dirigeant légal d'UN établissement client.
 * • Il a accès à TOUTES les fonctions de son tenant (pages, onglets, actions).
 * • Il est borné par SovereignGuard : il ne voit JAMAIS les données d'un autre tenant.
 * • Son libellé varie par verticale (Propriétaire, Maître Boulanger, Médecin Chef…).
 * • Il est le seul rôle autorisé à accéder aux pages 'migration' et 'vanguard'.
 * • Il est responsable légal des journaux NF525 de son établissement.
 * • Il peut déléguer à un directeur (80) la gestion quotidienne.
 * ──────────────────────────────────────────────────────────────────────
 * COUCHE GÉNÉRALISTE — pattern de vérification recommandé :
 *   const isOwnerLevel = PERMISSION_ROLE_LEVELS[role] >= PERMISSION_ROLE_LEVELS.proprietaire;
 *   const isManagerLevel = PERMISSION_ROLE_LEVELS[role] >= PERMISSION_ROLE_LEVELS.manager;
 *   const isSeniorLevel  = PERMISSION_ROLE_LEVELS[role] >= PERMISSION_ROLE_LEVELS.directeur;
 * ──────────────────────────────────────────────────────────────────────
 */
export const PERMISSION_ROLE_LEVELS: Record<PermissionRole, number> = {
    proprietaire:   100,
    directeur:       80,
    manager:         70,
    chef_cuisinier:  70,
    sous_chef:       60,
    comptable:       60,
    sommelier:       50,
    chef_rang:       40,
    serveur:         30,
    barman:          30,
    hotesse:         30,
    cuisinier:       30,
    commis:          20,
    plongeur:        10,
};

/**
 * Helpers de niveau généralistes — couche kernel, sans dépendance externe.
 * Utilisez ces fonctions plutôt que des comparaisons string directes.
 *
 * @example
 *   if (isAtLeastManager(currentUser.role)) { ... }
 */
export function getRoleLevel(role: string): number {
    return (PERMISSION_ROLE_LEVELS as Record<string, number>)[role] ?? 0;
}

/** true si le rôle est Propriétaire (niveau 100) */
export function isProprietaire(role: string): boolean {
    return getRoleLevel(role) >= PERMISSION_ROLE_LEVELS.proprietaire;
}

/** true si le rôle est Directeur ou au-dessus (niveau ≥ 80) */
export function isAtLeastDirecteur(role: string): boolean {
    return getRoleLevel(role) >= PERMISSION_ROLE_LEVELS.directeur;
}

/** true si le rôle est Manager ou au-dessus (niveau ≥ 70) */
export function isAtLeastManager(role: string): boolean {
    return getRoleLevel(role) >= PERMISSION_ROLE_LEVELS.manager;
}

/** true si le rôle est Comptable / Sous-chef ou au-dessus (niveau ≥ 60) */
export function isAtLeastSenior(role: string): boolean {
    return getRoleLevel(role) >= PERMISSION_ROLE_LEVELS.comptable;
}

/** true si le rôle est Chef de Rang ou au-dessus (niveau ≥ 40) */
export function isAtLeastChefRang(role: string): boolean {
    return getRoleLevel(role) >= PERMISSION_ROLE_LEVELS.chef_rang;
}

// ============ PAGE KEYS ============

export type PageKey =
    | 'dashboard'
    | 'floor_plan'
    | 'reservations'
    | 'pos'
    | 'pos_mobile'
    | 'kitchen'
    | 'kds'
    | 'bar'
    | 'inventory'
    | 'storage_map'
    | 'customer'
    | 'staff'
    | 'planning'
    | 'timeclock'
    | 'leaves'
    | 'recruitment'
    | 'finance'
    | 'analytics'
    | 'haccp'
    | 'groups'
    | 'seo'
    | 'marketing'
    | 'intelligence'
    | 'menu_builder'
    | 'registre'
    | 'operations'
    | 'crm'
    | 'settings'
    | 'mon_espace'
    | 'welcome_staff'
    | 'migration'
    | 'vanguard';
// NOTE: 'mcc' N'EST PAS une PageKey tenant — le MCC a ses propres routes /app/(admin)/

// ============ ACTION DEFINITIONS PAR PAGE ============

export type DashboardAction =
    | 'view' | 'view_ca' | 'view_objectives' | 'view_alerts'
    | 'export_report' | 'modify_widgets';

export type FloorPlanAction =
    | 'view' | 'add_table' | 'delete_table' | 'move_table' | 'resize_table'
    | 'modify_seats' | 'change_shape' | 'create_zone' | 'edit_zone' | 'delete_zone'
    | 'create_floor' | 'delete_floor' | 'change_status' | 'apply_template' | 'export_image';

export type ReservationsAction =
    | 'view' | 'create' | 'modify' | 'cancel' | 'confirm' | 'mark_arrived'
    | 'mark_noshow' | 'assign_table' | 'view_client_full' | 'overbooking' | 'send_reminder';

export type POSAction =
    | 'view' | 'open_table' | 'add_product' | 'remove_product' | 'change_quantity'
    | 'change_table' | 'split_bill' | 'merge_tables' | 'apply_discount_percent'
    | 'apply_discount_amount' | 'offer_product' | 'cancel_item_sent' | 'cancel_order'
    | 'cash_payment' | 'card_payment' | 'mixed_payment' | 'refund' | 'open_drawer'
    | 'close_register' | 'view_history' | 'reprint_ticket' | 'modify_price' | 'add_tip';

export type KitchenAction =
    | 'view_recipes' | 'view_recipe_details' | 'create_recipe' | 'modify_recipe'
    | 'duplicate_recipe' | 'delete_recipe' | 'archive_recipe' | 'add_step' | 'modify_step'
    | 'delete_step' | 'add_ingredient' | 'modify_ingredient_qty' | 'delete_ingredient'
    | 'view_cost' | 'view_margin' | 'modify_price' | 'add_photo' | 'print_fiche'
    | 'export_recipes' | 'create_ingredient' | 'modify_ingredient' | 'delete_ingredient_master';

export type KDSAction =
    | 'view' | 'mark_in_progress' | 'mark_ready' | 'recall' | 'prioritize' | 'cancel_from_kds' | 'view_history';

export type InventoryAction =
    | 'view' | 'add_stock' | 'remove_stock' | 'adjust_qty' | 'declare_loss'
    | 'create_item' | 'modify_item' | 'delete_item' | 'view_valuation' | 'export'
    | 'create_order' | 'validate_reception' | 'view_history' | 'physical_inventory';

export type StorageMapAction =
    | 'view' | 'move_stock' | 'add_to_location' | 'create_location' | 'modify_location'
    | 'delete_location' | 'view_dlc_alerts' | 'discard_expired';

export type CustomerAction =
    | 'view' | 'view_client' | 'create_client' | 'modify_client' | 'delete_client'
    | 'merge_duplicates' | 'add_note' | 'add_tag' | 'view_history_reservations'
    | 'view_history_orders' | 'view_ca_client' | 'export' | 'import' | 'send_email' | 'send_sms';

export type StaffAction =
    | 'view' | 'view_employee' | 'create_employee' | 'modify_employee' | 'disable_employee'
    | 'delete_employee' | 'assign_role' | 'modify_salary' | 'view_salaries' | 'manage_documents'
    | 'reset_password' | 'generate_pin';

export type PlanningAction =
    | 'view_own' | 'view_team' | 'create_shift' | 'modify_shift' | 'delete_shift'
    | 'duplicate_week' | 'publish' | 'assign_employee' | 'request_swap' | 'approve_swap' | 'export' | 'print';

export type LeavesAction =
    | 'view_own' | 'request_leave' | 'cancel_own_request' | 'view_team_requests'
    | 'approve_leave' | 'reject_leave' | 'modify_balance' | 'export';

export type FinanceAction =
    | 'view_dashboard' | 'view_ca_detail' | 'view_margins' | 'view_invoices'
    | 'create_invoice' | 'modify_invoice' | 'cancel_invoice' | 'send_invoice'
    | 'mark_paid' | 'view_suppliers' | 'create_supplier' | 'enter_expense'
    | 'bank_reconciliation' | 'close_period' | 'export';

export type AnalyticsAction =
    | 'view' | 'view_predictions' | 'compare_periods' | 'filter' | 'export'
    | 'create_custom_report' | 'schedule_report';

export type HACCPAction =
    | 'view' | 'record_temperature' | 'validate_checklist' | 'report_nonconformity'
    | 'close_nonconformity' | 'add_corrective_action' | 'view_history' | 'export_registers'
    | 'create_control_point' | 'modify_control_point';

export type GroupsAction =
    | 'view' | 'view_details' | 'create' | 'modify' | 'cancel' | 'add_deposit'
    | 'generate_contract' | 'send_quote';

export type SEOAction =
    | 'view_score' | 'view_recommendations' | 'connect_google' | 'view_page_analytics';

export type BarAction =
    | 'view_orders' | 'prepare' | 'mark_ready' | 'view_stock' | 'adjust_stock'
    | 'create_cocktail' | 'modify_cocktail';

export type SettingsAction =
    | 'view_identity' | 'modify_identity' | 'view_schedule' | 'modify_schedule'
    | 'manage_roles' | 'manage_users' | 'manage_integrations' | 'manage_security'
    | 'manage_backups' | 'manage_multi_site' | 'manage_license';

// ============ PAGE SETTINGS ============

export interface PageSettingConfig {
    key: string;
    label: string;
    description?: string;
    group: 'logic' | 'style';
    type: 'toggle' | 'select' | 'number' | 'text' | 'color' | 'action';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    roles: PermissionRole[];
}

export interface PageSettingsDefinition {
    page: PageKey;
    title: string;
    icon: string;
    settings: PageSettingConfig[];
}

// ============ PERMISSION CHECK TYPES ============

export type ActionPermission = {
    action: string;
    allowed: boolean;
    requiresPin?: boolean;
    limit?: number | string;
};

export interface PermissionCheckResult {
    allowed: boolean;
    requiresPin: boolean;
    limit?: number | string;
    reason?: string;
}
