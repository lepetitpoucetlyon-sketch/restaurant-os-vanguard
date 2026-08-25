
import {
    LayoutDashboard,
    Store,
    Map,
    CalendarDays,
    ChefHat,
    Package,
    Users,
    ClipboardCheck,
    BarChart3,
    Settings,
    Sparkles,
    CalendarRange,
    UserCog,
    LucideIcon,
    Globe,
    Instagram,
    Bot,
    Heart,
    Wine,
    Utensils,
    TrendingUp,
    Briefcase,
    Shield,
    Wallet,
    BookOpen,
    Refrigerator,
    Palmtree,
    ShieldCheck,
    FileSpreadsheet,
    PartyPopper,
    UserPlus,
    ScrollText,
    Building2,
    CreditCard,
    Smartphone,
    Activity,
    Plug,
    Wrench,
    Truck,
    ShoppingCart,
    Clock,
    Gift,
    Bell,
    Microscope,
    Receipt,
    Banknote,
    FileCheck,
    Gauge,
    HelpCircle,
    Pizza,
    Coffee,
    Flame,
    Star,
    Newspaper,
    Lock,
    MonitorSmartphone,
} from "lucide-react";

export type NavMode = 'tenant' | 'mcc' | 'both';

export interface NavItem {
    label: string;
    key: string;
    href: string;
    icon: LucideIcon;
    category: string;
    badge?: string;
    /**
     * Capability feature-flag.
     * If present AND the capability is explicitly set to `false`, item is hidden.
     * If absent or capability is undefined/true → always visible.
     */
    requiredCapability?: string;
    /**
     * RBAC — niveau RBAC minimum pour voir cet item.
     * Basé sur `PERMISSION_ROLE_LEVELS` (kernel/contracts/rbac.ts) :
     *   100 = admin | 90 = directeur | 70 = manager | 60 = comptable
     *   50 = chef_rang / chef_cuisinier | 45 = chef_cuisinier
     *   40 = serveur / barman / vendeur | 35 = cuisinier | 30 = hotesse | 10 = plongeur
     * Si absent → visible pour tous les rôles tenant.
     */
    minLevel?: number;
}

export interface NavSection {
    id: string;
    key: string;
    title: string;
    icon: LucideIcon;
    color: string;
    items: NavItem[];
    /** Which deployment mode shows this section. Defaults to 'tenant'. */
    mode?: NavMode;
}

export const NAV_SECTIONS: NavSection[] = [
    // ── Tableau de bord ──────────────────────────────────────────────────────
    {
        id: 'main',
        key: 'main',
        title: 'Principal',
        icon: LayoutDashboard,
        color: '#C5A059',
        mode: 'both',
        items: [
            { label: "Tableau de bord", key: "dashboard", href: "/", icon: LayoutDashboard, category: "dashboard" },
        ]
    },

    // ── Intelligence IA ───────────────────────────────────────────────────────
    {
        id: 'intelligence',
        key: 'intelligence',
        title: 'Intelligence IA',
        icon: Sparkles,
        color: '#10B981',
        mode: 'both',
        items: [
            { label: "Hub Intelligence", key: "intelligence_hub", href: "/intelligence", icon: Sparkles, category: "analytics", minLevel: 70 },
            { label: "Intelligence Exécutive", key: "executive_intelligence", href: "/admin/agent", icon: Bot, category: "analytics", minLevel: 90 },
            { label: "Cartographie 3D", key: "system_map", href: "/system-map", icon: Map, category: "analytics", minLevel: 70 },
        ]
    },

    // ── MCC-only ──────────────────────────────────────────────────────────────
    {
        id: 'mcc_fleet',
        key: 'mcc_fleet',
        title: 'Flotte Restaurants',
        icon: Building2,
        color: '#3B82F6',
        mode: 'mcc',
        items: [
            { label: "Console MCC", key: "mcc_console", href: "/admin/mcc", icon: Building2, category: "mcc", requiredCapability: "mod_fleet_management" },
            { label: "Flotte & Tenants", key: "mcc_fleet", href: "/admin/mcc?tab=fleet", icon: Building2, category: "mcc", requiredCapability: "mod_fleet_management" },
            { label: "Conformité", key: "mcc_compliance", href: "/admin/mcc?tab=compliance", icon: ShieldCheck, category: "mcc", requiredCapability: "mod_fleet_management" },
            { label: "Prospection", key: "mcc_prospecting", href: "/admin/prospecting", icon: Star, category: "mcc" },
        ]
    },
    {
        id: 'mcc_billing',
        key: 'mcc_billing',
        title: 'Facturation & MDM',
        icon: CreditCard,
        color: '#8B5CF6',
        mode: 'mcc',
        items: [
            { label: "Trésorerie SaaS", key: "mcc_treasury", href: "/admin/mcc?tab=treasury", icon: CreditCard, category: "mcc" },
            { label: "Intelligence Flotte", key: "mcc_intelligence", href: "/admin/mcc?tab=intelligence", icon: Activity, category: "mcc" },
            { label: "MDM Devices", key: "mcc_mdm", href: "/admin/mcc?tab=fleet", icon: Smartphone, category: "mcc" },
        ]
    },

    // ── Opérations & Caisse ───────────────────────────────────────────────────
    {
        id: 'operations',
        key: 'operations',
        title: 'Opérations & Caisse',
        icon: Utensils,
        color: '#3B82F6',
        mode: 'tenant',
        items: [
            { label: "Point de vente", key: "pos", href: "/pos", icon: Store, category: "pos", requiredCapability: "mod_pos" },
            { label: "POS Mobile", key: "pos_mobile", href: "/pos-mobile", icon: MonitorSmartphone, category: "pos", requiredCapability: "mod_pos" },
            { label: "Éditeur de Carte", key: "menu_builder", href: "/menu-builder", icon: ChefHat, category: "pos", requiredCapability: "mod_pos", minLevel: 50 },
            { label: "Ingénierie Menu", key: "menu_engineering", href: "/menu-engineering", icon: Flame, category: "pos", minLevel: 70, requiredCapability: "mod_analytics" },
            { label: "Plan de salle", key: "floor_plan", href: "/floor-plan", icon: Map, category: "floor-plan", requiredCapability: "mod_floor_plan" },
            { label: "Gestion Opérations", key: "operations", href: "/operations", icon: ClipboardCheck, category: "operations", minLevel: 50 },
        ]
    },

    // ── Production & Stocks (KDS / Cuisine / Bar / Stocks) ────────────────────
    {
        id: 'production',
        key: 'production',
        title: 'Cuisine & Production',
        icon: ChefHat,
        color: '#F97316',
        mode: 'tenant',
        items: [
            { label: "Production (KDS)", key: "kds", href: "/kds", icon: ChefHat, category: "kds", requiredCapability: "mod_kds" },
            { label: "Gestion Cuisine", key: "kitchen_management", href: "/kitchen", icon: Coffee, category: "kitchen", requiredCapability: "mod_kitchen_management", minLevel: 45 },
            { label: "Bar & Sommellerie", key: "bar", href: "/bar", icon: Wine, category: "kitchen", requiredCapability: "mod_bar", minLevel: 35 },
            { label: "Stocks & Inventaire", key: "inventory", href: "/inventory", icon: Package, category: "inventory", requiredCapability: "mod_inventory", minLevel: 50 },
            { label: "Plan des Stockages", key: "storage_map", href: "/inventory?tab=storage", icon: Refrigerator, category: "inventory", requiredCapability: "mod_storage_map", minLevel: 50 },
            { label: "Réception Marchandises", key: "goods_reception", href: "/admin/inventory/reception", icon: Truck, category: "inventory", minLevel: 50 },
            { label: "Achats & Économat", key: "purchasing", href: "/inventory?tab=orders", icon: ShoppingCart, category: "inventory", requiredCapability: "mod_purchasing", minLevel: 60 },
        ]
    },


    // ── Qualité & Conformité ──────────────────────────────────────────────────
    {
        id: 'compliance',
        key: 'compliance',
        title: 'Qualité & Conformité',
        icon: ShieldCheck,
        color: '#14B8A6',
        mode: 'tenant',
        items: [
            { label: "HACCP & Qualité", key: "haccp", href: "/haccp", icon: ClipboardCheck, category: "haccp", requiredCapability: "mod_haccp", minLevel: 40 },
            { label: "Contrôle Réception", key: "quality_control", href: "/haccp?tab=quality", icon: Microscope, category: "haccp", requiredCapability: "mod_quality_control", minLevel: 40 },
            { label: "Parc Matériel & GMAO", key: "facility", href: "/facility", icon: Wrench, category: "facility", minLevel: 50 },
            { label: "Registres Obligatoires", key: "registre", href: "/registre", icon: ScrollText, category: "registre", badge: "LÉGAL", requiredCapability: "mod_registre", minLevel: 70 },
        ]
    },

    // ── Livraison & Commandes Online ──────────────────────────────────────────
    {
        id: 'delivery',
        key: 'delivery',
        title: 'Livraison & Online',
        icon: Truck,
        color: '#F59E0B',
        mode: 'tenant',
        items: [
            { label: "Commandes Livraison", key: "delivery_orders", href: "/operations?tab=delivery", icon: Truck, category: "delivery", requiredCapability: "mod_delivery" },
            { label: "Dark Kitchen & Hubs", key: "dark_kitchen", href: "/operations?tab=dark-kitchen", icon: Pizza, category: "delivery", requiredCapability: "mod_dark_kitchen", minLevel: 70 },
        ]
    },

    // ── Clients & Réservations ────────────────────────────────────────────────
    {
        id: 'clients',
        key: 'clients',
        title: 'Clients & Réservations',
        icon: Heart,
        color: '#EC4899',
        mode: 'tenant',
        items: [
            { label: "Réservations", key: "reservations", href: "/reservations", icon: CalendarDays, category: "reservations", requiredCapability: "mod_reservations" },
            { label: "CRM Clients", key: "crm", href: "/crm", icon: Heart, category: "reservations", requiredCapability: "mod_customer", minLevel: 50 },
            { label: "Fidélité & Gift Cards", key: "loyalty", href: "/crm?tab=loyalty", icon: Gift, category: "loyalty", requiredCapability: "mod_loyalty", minLevel: 50 },
            { label: "Devis & Privatisation", key: "quotes", href: "/marketing?tab=quotes", icon: FileSpreadsheet, category: "reservations", requiredCapability: "mod_quotes", minLevel: 50 },
            { label: "Groupes & Événements", key: "groups", href: "/groups", icon: PartyPopper, category: "reservations", requiredCapability: "mod_groups", minLevel: 50 },
        ]
    },

    // ── Équipe & RH ────────────────────────────────────────────────────────────
    {
        id: 'team',
        key: 'team',
        title: 'Équipe & RH',
        icon: Users,
        color: '#06B6D4',
        mode: 'tenant',
        items: [
            { label: "Prise de Poste", key: "onboarding", href: "/welcome-staff", icon: Briefcase, category: "onboarding", requiredCapability: "mod_onboarding" },
            { label: "Pointage Temps Réel", key: "timeclock", href: "/timeclock", icon: Clock, category: "staff", requiredCapability: "mod_hr" },
            { label: "Ressources Humaines", key: "hr", href: "/staff?tab=team", icon: Users, category: "staff", requiredCapability: "mod_hr", minLevel: 70 },
            { label: "Planning", key: "planning", href: "/staff?tab=planning", icon: CalendarRange, category: "planning", requiredCapability: "mod_planning", minLevel: 70 },
            { label: "Congés & Absences", key: "leaves", href: "/leaves", icon: Palmtree, category: "planning", requiredCapability: "mod_leaves", minLevel: 70 },
            { label: "Recrutement", key: "recruitment", href: "/staff?tab=recruitment", icon: UserPlus, category: "recruitment", requiredCapability: "mod_recruitment", minLevel: 70 },
        ]
    },

    // ── Analytics & Marketing ─────────────────────────────────────────────────
    {
        id: 'analytics',
        key: 'marketing',
        title: 'Analytics & Marketing',
        icon: TrendingUp,
        color: '#8B5CF6',
        mode: 'tenant',
        items: [
            { label: "Analytique BI", key: "analytics", href: "/analytics", icon: BarChart3, category: "analytics", requiredCapability: "mod_analytics", minLevel: 70 },
            { label: "Analyse Rentabilité", key: "profitability", href: "/analytics?tab=profitability", icon: TrendingUp, category: "analytics", minLevel: 70 },
            { label: "Marketing & Social", key: "social_marketing", href: "/marketing", icon: Instagram, category: "analytics", requiredCapability: "mod_social_marketing", minLevel: 70 },
            { label: "Référencement IA", key: "ai_referencing", href: "/marketing?tab=ai", icon: Bot, category: "analytics", requiredCapability: "mod_ai_referencing", minLevel: 70 },
            { label: "SEO & Visibilité", key: "seo", href: "/marketing/seo", icon: Globe, category: "analytics", requiredCapability: "mod_seo", minLevel: 70 },
            { label: "E-Réputation", key: "reputation", href: "/marketing?tab=reputation", icon: Star, category: "analytics", minLevel: 70 },
        ]
    },

    // ── Finance & Trésorerie ──────────────────────────────────────────────────
    {
        id: 'finance',
        key: 'finance',
        title: 'Finance & Trésorerie',
        icon: Wallet,
        color: '#EF4444',
        mode: 'tenant',
        items: [
            { label: "Trésorerie & Prévisions", key: "treasury", href: "/finance", icon: Wallet, category: "accounting", requiredCapability: "mod_treasury", minLevel: 70 },
            { label: "Dépenses & Charges", key: "expenses", href: "/finance?tab=expenses", icon: Receipt, category: "accounting", minLevel: 70 },
            { label: "Rapprochement Bancaire", key: "bank_reconciliation", href: "/finance?tab=bank", icon: Banknote, category: "accounting", minLevel: 60 },
        ]
    },

    // ── Comptabilité ──────────────────────────────────────────────────────────
    {
        id: 'accounting',
        key: 'accounting',
        title: 'Comptabilité & Fiscal',
        icon: BookOpen,
        color: '#F59E0B',
        mode: 'tenant',
        items: [
            { label: "Gestion Comptable", key: "accounting_management", href: "/finance?tab=accounting", icon: BookOpen, category: "accounting", requiredCapability: "mod_accounting_management", minLevel: 60 },
            { label: "Conformité NF525", key: "nf525", href: "/nf525", icon: FileCheck, category: "accounting", badge: "NF525", minLevel: 70 },
            { label: "Portail Comptable", key: "accounting_portal", href: "/accounting-portal", icon: Newspaper, category: "accounting", minLevel: 60 },
            { label: "Registres Légaux", key: "registre_legal", href: "/registre", icon: ScrollText, category: "registre", badge: "LÉGAL", requiredCapability: "mod_registre", minLevel: 70 },
        ]
    },

    // ── Réseau & Franchise ────────────────────────────────────────────────────
    {
        id: 'franchise',
        key: 'franchise',
        title: 'Réseau & Franchise',
        icon: Building2,
        color: '#6366F1',
        mode: 'tenant',
        items: [
            { label: "Multi-Sites & Réseau", key: "franchise_network", href: "/franchise", icon: Building2, category: "franchise", minLevel: 90 },
        ]
    },

    // ── Administration ────────────────────────────────────────────────────────
    {
        id: 'admin',
        key: 'admin',
        title: 'Administration',
        icon: Shield,
        color: '#64748B',
        mode: 'both',
        items: [
            { label: "Réglages", key: "settings", href: "/settings", icon: Settings, category: "settings" },
            { label: "Mon Espace", key: "mon_espace", href: "/mon-espace", icon: UserCog, category: "settings" },
            { label: "Checklist Mise en Service", key: "onboarding_checklist", href: "/settings?tab=onboarding-checklist", icon: ClipboardCheck, category: "settings", minLevel: 70 },
            { label: "Intégrations & API", key: "integrations", href: "/integrations", icon: Plug, category: "settings", requiredCapability: "mod_settings", minLevel: 70 },
            { label: "Gestion des Accès", key: "access_management", href: "/account-settings", icon: Lock, category: "account-settings", minLevel: 90 },
            { label: "Notifications & Alertes", key: "notifications", href: "/settings?tab=notifications", icon: Bell, category: "settings", minLevel: 70 },
            { label: "Aide & Support", key: "aide", href: "/aide", icon: HelpCircle, category: "support" },
            { label: "Tableau de Bord Perf.", key: "simulator", href: "/simulator", icon: Gauge, category: "admin", minLevel: 90 },
        ]
    },
];

/** Returns only sections visible in the given APP_MODE. */
export function filterNavSections(sections: NavSection[], mode: 'tenant' | 'mcc'): NavSection[] {
    return sections.filter(s => {
        const sectionMode = s.mode ?? 'tenant';
        return sectionMode === 'both' || sectionMode === mode;
    });
}

/**
 * Filters nav items by tenant capabilities.
 * An item is visible if:
 *   - it has no requiredCapability, OR
 *   - the capability is not explicitly set to false (undefined = show).
 */
export function filterByCapabilities(
    sections: NavSection[],
    capabilities: Record<string, boolean> | undefined,
): NavSection[] {
    if (!capabilities || Object.keys(capabilities).length === 0) return sections;
    return sections
        .map(section => ({
            ...section,
            items: section.items.filter(item => {
                if (!item.requiredCapability) return true;
                return capabilities[item.requiredCapability] !== false;
            }),
        }))
        .filter(section => section.items.length > 0);
}

/**
 * RBAC filter — hides items whose `minLevel` is above the current user's role level.
 * If `userLevel` is undefined (unknown role), only items without `minLevel` are shown.
 * Items without `minLevel` are always visible regardless of role.
 */
export function filterByRole(
    sections: NavSection[],
    userLevel: number | undefined,
): NavSection[] {
    return sections
        .map(section => ({
            ...section,
            items: section.items.filter(item => {
                if (item.minLevel === undefined) return true;
                if (userLevel === undefined) return false;
                return userLevel >= item.minLevel;
            }),
        }))
        .filter(section => section.items.length > 0);
}

interface SectionOverride { title?: string; items?: Record<string, string>; }

const VERTICAL_NAV_OVERRIDES: Record<string, Record<string, SectionOverride>> = {
    garage: {
        operations: { title: 'Atelier & Caisse', items: { floor_plan: 'Plan Atelier & Baies', operations: 'Ordres de Réparation (OR)' } },
        production: { title: 'Pièces & Déchets', items: { inventory: 'Pièces & Consommables', storage_map: 'Rayonnages & Casiers' } },
        stocks: { title: 'Pièces & Déchets', items: { inventory: 'Pièces & Consommables', storage_map: 'Rayonnages & Casiers' } },
    },
    clinic: {
        operations: { title: 'Consultations & Caisse', items: { pos: 'Encaissement Actes CCAM', floor_plan: 'Plan des Cabinets' } },
        production: { title: 'Pharmacie & Matériel', items: { inventory: 'Dispositifs & Matériel' } },
        stocks: { title: 'Pharmacie & Matériel', items: { inventory: 'Dispositifs & Matériel' } },
    },
    salon: {
        operations: { title: 'Salon & Prestations', items: { pos: 'Caisse Prestations', floor_plan: 'Plan Fauteuils & Bacs' } },
        production: { title: 'Produits & Stocks', items: { inventory: 'Stock Cabine & Revente' } },
        stocks: { title: 'Produits & Stocks', items: { inventory: 'Stock Cabine & Revente' } },
    },
    gym: {
        operations: { title: 'Club & Membres', items: { pos: 'Caisse & Forfaits', floor_plan: 'Plan Espaces & Plateaux' } },
        production: { title: 'Matériel & Nutrition', items: { inventory: 'Stocks & Équipements' } },
        stocks: { title: 'Matériel & Nutrition', items: { inventory: 'Stocks & Équipements' } },
    },
    coworking: {
        operations: { title: 'Espaces & Réservations', items: { pos: 'Caisse & Pass', floor_plan: 'Plan Bureaux & Salles' } },
        production: { title: 'Fournitures & Boissons', items: { inventory: 'Stocks & Fournitures' } },
        stocks: { title: 'Fournitures & Boissons', items: { inventory: 'Stocks & Fournitures' } },
    },
    veterinary: {
        operations: { title: 'Clinique & Soins', items: { pos: 'Caisse Soins & Actes', floor_plan: 'Plan Salles Consultation' } },
        production: { title: 'Pharmacie & Matériel', items: { inventory: 'Médicaments & Dispositifs' } },
        stocks: { title: 'Pharmacie & Matériel', items: { inventory: 'Médicaments & Dispositifs' } },
    },
    florist: {
        operations: { title: 'Boutique & Commandes', items: { pos: 'Caisse & Compositions', floor_plan: 'Plan Atelier & Serre' } },
        production: { title: 'Fleurs & Végétaux', items: { inventory: 'Tiges & Accessoires' } },
        stocks: { title: 'Fleurs & Végétaux', items: { inventory: 'Tiges & Accessoires' } },
    },
    hotel: {
        operations: { title: 'Réception & Hébergement', items: { pos: 'Facturation & Caisse', floor_plan: 'Plan des Chambres & Étages', menu_builder: 'Services & Tarifs' } },
        production: { title: 'Gouvernance & Lingerie', items: { inventory: 'Stocks Linge & Produits', kds: 'Service d’Étage & Commandes' } },
        stocks: { title: 'Gouvernance & Lingerie', items: { inventory: 'Stocks Linge & Produits' } },
    },
    bakery: {
        operations: { title: 'Vente & Boutique', items: { pos: 'Caisse & Vente Comptoir', floor_plan: 'Vitrine & Espaces', menu_builder: 'Catalogue Pains & Pâtisseries' } },
        production: { title: 'Fournil & Laboratoire', items: { inventory: 'Farines & Ingrédients', kds: 'Fournées & Préparations' } },
        stocks: { title: 'Matières Premières', items: { inventory: 'Farines & Ingrédients' } },
    },
    retail: {
        operations: { title: 'Vente & Magasin', items: { pos: 'Caisse Enregistreuse', floor_plan: 'Plan Magasin & Rayons', menu_builder: 'Catalogue Articles' } },
        production: { title: 'Marchandises & Réserve', items: { inventory: 'Stock Boutique & Réserve' } },
        stocks: { title: 'Marchandises & Stocks', items: { inventory: 'Stock Boutique & Réserve' } },
    },
    custom: {
        operations: { title: 'Opérations & Caisse', items: { pos: 'Caisse & Encaissement', floor_plan: 'Plan des Espaces', menu_builder: 'Catalogue Services' } },
        production: { title: 'Activité & Stocks', items: { inventory: 'Inventaire & Stocks' } },
        stocks: { title: 'Activité & Stocks', items: { inventory: 'Inventaire & Stocks' } },
    },
};


const FOOD_ONLY_KEYS = ['bar', 'kitchen_management', 'kds', 'menu_builder', 'menu_engineering', 'haccp', 'quality_control', 'dark_kitchen', 'delivery_orders'];
const FOOD_VARIANTS = ['restaurant', 'bakery', 'hotel'];

/** Adapts and filters nav sections according to the active tenant vertical variant. */
export function filterByVertical(sections: NavSection[], rawVariant?: string): NavSection[] {
    const variant = (rawVariant || 'restaurant').toLowerCase();
    const isFood = FOOD_VARIANTS.includes(variant);
    const overrides = VERTICAL_NAV_OVERRIDES[variant] ?? {};

    return sections
        .map(section => {
            const sec = { ...section, items: [...section.items] };
            if (!isFood) sec.items = sec.items.filter(item => !FOOD_ONLY_KEYS.includes(item.key));
            const over = overrides[sec.id];
            if (over) {
                if (over.title) sec.title = over.title;
                if (over.items) sec.items = sec.items.map(item => over.items![item.key] ? { ...item, label: over.items![item.key] } : item);
            }
            return sec;
        })
        .filter(section => section.items.length > 0);
}

/**
 * 🛰️ B2: Filters and re-orders navigation sections based on tenant UXProfile.
 * - Applies switchboard feature flags (e.g. enableBarTabs, enableFloorPlan3D)
 * - Re-orders sections according to `navigation.navigationOrder` if defined
 */
export function filterByUXProfile(
    sections: NavSection[],
    uxProfile?: {
        switchboard?: {
            enableBarTabs?: boolean;
            enableFloorPlan3D?: boolean;
            enableKDSFocusMode?: boolean;
            enableCustomerDisplay?: boolean;
        };
        navigation?: {
            navigationOrder?: string[];
            primaryTab?: string;
        };
    },
): NavSection[] {
    if (!uxProfile) return sections;

    let result = sections;

    // 1. Switchboard feature-flag filtering
    if (uxProfile.switchboard) {
        const { enableBarTabs } = uxProfile.switchboard;
        if (enableBarTabs === false) {
            result = result.map(section => ({
                ...section,
                items: section.items.filter(item => item.key !== 'bar'),
            })).filter(section => section.items.length > 0);
        }
    }

    // 2. Navigation order reordering
    if (uxProfile.navigation?.navigationOrder && uxProfile.navigation.navigationOrder.length > 0) {
        const order = uxProfile.navigation.navigationOrder;
        result = [...result].sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }

    return result;
}
