import type { CategoryKey } from '@/lib/AccessPolicyManager';

export interface RoleTemplate {
    id: string;
    name: string;
    description: string;
    categories: CategoryKey[];
    actions: Record<string, string[]>;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
    {
        id: 'template-serveur',
        name: 'Serveur',
        description: 'Accès POS, commandes, tables, réservations. Pas de finance ni RH.',
        categories: ['dashboard', 'operations'],
        actions: {
            pos: ['apply_discount_percent', 'apply_discount_amount', 'close_register', 'open_drawer'],
            reservations: ['cancel_reservation'],
            kds: ['recall_order', 'force_bump'],
        },
    },
    {
        id: 'template-chef',
        name: 'Chef cuisinier',
        description: 'Accès cuisine, recettes, stocks, HACCP. Vue analytique food-cost.',
        categories: ['dashboard', 'operations', 'inventory', 'quality'],
        actions: {
            kitchen: ['edit_recipe', 'delete_product'],
            haccp: ['validate_control', 'close_nonconformity', 'export_pms'],
            inventory: ['physical_count', 'adjust_stock'],
            kds: ['recall_order', 'force_bump'],
        },
    },
    {
        id: 'template-manager',
        name: 'Manager',
        description: 'Accès complet sauf paramètres admin. Finance, RH, marketing, stocks.',
        categories: ['dashboard', 'operations', 'hr', 'marketing', 'finance', 'inventory', 'quality'],
        actions: {
            pos: ['refund', 'apply_discount_percent', 'apply_discount_amount', 'cancel_item_sent', 'cancel_order', 'offer_product', 'modify_price', 'close_register', 'open_drawer'],
            finance: ['close_period', 'bank_reconciliation', 'cancel_invoice', 'export'],
            staff: ['modify_salary', 'assign_role', 'modify_employee'],
            reservations: ['override_capacity', 'cancel_reservation'],
            inventory: ['physical_inventory', 'physical_count', 'delete_item', 'adjust_stock'],
            haccp: ['validate_control', 'close_nonconformity', 'export_pms', 'delete_lot'],
            kds: ['recall_order', 'force_bump', 'override_allergen'],
            crm: ['export_customers', 'delete_customer', 'send_campaign', 'edit_consent'],
            kitchen: ['edit_recipe', 'edit_margin', 'delete_product'],
            bar: ['edit_cocktail', 'adjust_cellar'],
            marketing: ['publish_campaign', 'edit_seo', 'send_quote'],
            analytics: ['trigger_vision_analysis'],
            registre: ['close_intervention'],
        },
    },
];

export function getTemplate(id: string): RoleTemplate | undefined {
    return ROLE_TEMPLATES.find(t => t.id === id);
}

export function applyTemplate(template: RoleTemplate): {
    categories: CategoryKey[];
    actions: Record<string, string[]>;
} {
    return {
        categories: [...template.categories],
        actions: Object.fromEntries(
            Object.entries(template.actions).map(([k, v]) => [k, [...v]])
        ),
    };
}
