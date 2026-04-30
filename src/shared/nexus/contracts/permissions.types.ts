/**
 * PERMISSIONS TYPES - Granular Action-based Permissions
 * Defines all possible actions on each page and role-based access.
 */

// ============ ROLE DEFINITIONS ============

export type PermissionRole =
    | 'super_admin'
    | 'directeur'
    | 'manager'
    | 'comptable'
    | 'chef_rang'
    | 'serveur'
    | 'chef_cuisinier'
    | 'cuisinier'
    | 'barman'
    | 'hotesse'
    | 'plongeur';

export const PERMISSION_ROLE_LABELS: Record<PermissionRole, string> = {
    super_admin: 'Super Administrateur',
    directeur: 'Directeur',
    manager: 'Manager',
    comptable: 'Comptable',
    chef_rang: 'Chef de Rang',
    serveur: 'Serveur(se)',
    chef_cuisinier: 'Chef Cuisinier',
    cuisinier: 'Cuisinier',
    barman: 'Barman',
    hotesse: 'Hôtesse',
    plongeur: 'Plongeur',
};

export const PERMISSION_ROLE_LEVELS: Record<PermissionRole, number> = {
    super_admin: 100,
    directeur: 90,
    manager: 70,
    comptable: 60,
    chef_rang: 50,
    chef_cuisinier: 45,
    serveur: 40,
    cuisinier: 35,
    barman: 35,
    hotesse: 30,
    plongeur: 10,
};

// ============ PAGE KEYS ============

export type PageKey =
    | 'dashboard'
    | 'floor_plan'
    | 'reservations'
    | 'pos'
    | 'kitchen'
    | 'kds'
    | 'inventory'
    | 'storage_map'
    | 'customer'
    | 'staff'
    | 'planning'
    | 'leaves'
    | 'finance'
    | 'analytics'
    | 'haccp'
    | 'groups'
    | 'seo'
    | 'bar'
    | 'registre'
    | 'settings';

// ============ ACTION DEFINITIONS PER PAGE ============

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

// ============ PAGE SETTINGS (⚙️ Gear Icon) ============

export interface PageSettingConfig {
    key: string;
    label: string;
    description?: string;
    group: 'logic' | 'style'; // New field to categorize setting
    type: 'toggle' | 'select' | 'number' | 'text' | 'color' | 'action';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    roles: PermissionRole[];  // Roles that can modify this setting
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
