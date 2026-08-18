
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
} from "lucide-react";

export type NavMode = 'tenant' | 'mcc' | 'both';

export interface NavItem {
    label: string;
    key: string;
    href: string;
    icon: LucideIcon;
    category: string;
    badge?: string;
    requiredCapability?: string;
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
    {
        id: 'intelligence',
        key: 'intelligence',
        title: 'Intelligence IA',
        icon: Sparkles,
        color: '#10B981',
        mode: 'both',
        items: [
            { label: "Hub Intelligence", key: "intelligence_hub", href: "/intelligence", icon: Sparkles, category: "analytics" },
            { label: "Intelligence Exécutive", key: "executive_intelligence", href: "/admin/agent", icon: Sparkles, category: "analytics" },
            { label: "Cartographie 3D", key: "system_map", href: "/system-map", icon: Map, category: "analytics" },
        ]
    },

    // ── MCC-only sections ─────────────────────────────────────────────────────
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

    // ── Tenant-only sections ──────────────────────────────────────────────────
    {
        id: 'operations',
        key: 'operations',
        title: 'Opérations',
        icon: Utensils,
        color: '#3B82F6',
        mode: 'tenant',
        items: [
            { label: "Point de vente", key: "pos", href: "/pos", icon: Store, category: "pos", requiredCapability: "mod_pos" },
            { label: "Éditeur de Carte", key: "menu_builder", href: "/menu-builder", icon: ChefHat, category: "pos", requiredCapability: "mod_pos" },
            { label: "Plan de salle", key: "floor_plan", href: "/floor-plan", icon: Map, category: "floor-plan", requiredCapability: "mod_floor_plan" },
            { label: "Production (KDS)", key: "kds", href: "/kds", icon: ChefHat, category: "kds", requiredCapability: "mod_kds" },
            { label: "Opérations", key: "operations", href: "/operations", icon: ClipboardCheck, category: "operations" },
        ]
    },
    {
        id: 'clients',
        key: 'clients',
        title: 'Clients & Réservations',
        icon: Heart,
        color: '#EC4899',
        mode: 'tenant',
        items: [
            { label: "Réservations", key: "reservations", href: "/reservations", icon: CalendarDays, category: "reservations", requiredCapability: "mod_reservations" },
            { label: "CRM Clients", key: "crm", href: "/crm", icon: Heart, category: "reservations", requiredCapability: "mod_customer" },
            { label: "Devis & Privatisation", key: "quotes", href: "/marketing?tab=quotes", icon: FileSpreadsheet, category: "reservations", requiredCapability: "mod_quotes" },
            { label: "Groupes & Privatisation", key: "groups", href: "/groups", icon: PartyPopper, category: "reservations", requiredCapability: "mod_groups" },
        ]
    },
    {
        id: 'production',
        key: 'production',
        title: 'Cuisine & Production',
        icon: ChefHat,
        color: '#F97316',
        mode: 'tenant',
        items: [
            { label: "Gestion Cuisine", key: "kitchen_management", href: "/kitchen", icon: ChefHat, category: "kitchen", requiredCapability: "mod_kitchen_management" },
            { label: "Bar & Sommellerie", key: "bar", href: "/bar", icon: Wine, category: "kitchen", requiredCapability: "mod_bar" },
            { label: "Plan des Stockages", key: "storage_map", href: "/inventory?tab=storage", icon: Refrigerator, category: "inventory", requiredCapability: "mod_storage_map" },
            { label: "Stocks & Inventaire", key: "inventory", href: "/inventory", icon: Package, category: "inventory", requiredCapability: "mod_inventory" },
            { label: "HACCP & Qualité", key: "haccp", href: "/haccp", icon: ClipboardCheck, category: "haccp", requiredCapability: "mod_haccp" },
            { label: "Contrôle Réception", key: "quality_control", href: "/haccp?tab=quality", icon: ShieldCheck, category: "haccp", requiredCapability: "mod_quality_control" },
            { label: "Parc Matériel & GMAO", key: "facility", href: "/facility", icon: Wrench, category: "kitchen" },
        ]
    },
    {
        id: 'team',
        key: 'team',
        title: 'Équipe & RH',
        icon: Users,
        color: '#06B6D4',
        mode: 'tenant',
        items: [
            { label: "Prise de Poste", key: "onboarding", href: "/welcome-staff", icon: Briefcase, category: "onboarding", requiredCapability: "mod_onboarding" },
            { label: "Ressources Humaines", key: "hr", href: "/staff?tab=team", icon: Users, category: "staff", requiredCapability: "mod_hr" },
            { label: "Planning", key: "planning", href: "/staff?tab=planning", icon: CalendarRange, category: "planning", requiredCapability: "mod_planning" },
            { label: "Congés & Absences", key: "leaves", href: "/staff?tab=leaves", icon: Palmtree, category: "planning", requiredCapability: "mod_leaves" },
            { label: "Recrutement", key: "recruitment", href: "/staff?tab=recruitment", icon: UserPlus, category: "recruitment", requiredCapability: "mod_recruitment" },
        ]
    },
    {
        id: 'analytics',
        key: 'marketing',
        title: 'Analytics & Marketing',
        icon: TrendingUp,
        color: '#8B5CF6',
        mode: 'tenant',
        items: [
            { label: "Analytique BI", key: "analytics", href: "/analytics", icon: BarChart3, category: "analytics", requiredCapability: "mod_analytics" },
            { label: "Analyse Rentabilité", key: "google_analytics", href: "/analytics?tab=profitability", icon: BarChart3, category: "analytics", requiredCapability: "mod_google_analytics" },
            { label: "Marketing & Social", key: "social_marketing", href: "/marketing", icon: Instagram, category: "analytics", requiredCapability: "mod_social_marketing" },
            { label: "Référencement IA", key: "ai_referencing", href: "/marketing?tab=ai", icon: Bot, category: "analytics", requiredCapability: "mod_ai_referencing" },
            { label: "SEO & Référencement", key: "seo", href: "/marketing?tab=seo", icon: Globe, category: "analytics", requiredCapability: "mod_seo" },
        ]
    },
    {
        id: 'finance',
        key: 'finance',
        title: 'Finance',
        icon: Wallet,
        color: '#EF4444',
        mode: 'tenant',
        items: [
            { label: "Trésorerie & Prévisions", key: "treasury", href: "/finance", icon: Wallet, category: "accounting", requiredCapability: "mod_treasury" },
        ]
    },
    {
        id: 'accounting',
        key: 'accounting',
        title: 'Comptabilité',
        icon: BookOpen,
        color: '#F59E0B',
        mode: 'tenant',
        items: [
            { label: "Gestion Comptable", key: "accounting_management", href: "/finance?tab=accounting", icon: BookOpen, category: "accounting", requiredCapability: "mod_accounting_management" },
        ]
    },
    {
        id: 'registre',
        key: 'registre',
        title: 'Registres Obligatoires',
        icon: ScrollText,
        color: '#0EA5E9',
        mode: 'tenant',
        items: [
            { label: "Registres & Conformité", key: "registre", href: "/registre", icon: ScrollText, category: "registre", badge: "OBLIGATOIRE", requiredCapability: "mod_registre" },
        ]
    },
    {
        id: 'franchise',
        key: 'franchise',
        title: 'Réseau & Franchise',
        icon: Building2,
        color: '#6366F1',
        mode: 'tenant',
        items: [
            { label: "Multi-Sites & Réseau", key: "franchise_network", href: "/franchise", icon: Building2, category: "franchise" },
        ]
    },

    // ── Admin — visible in both modes ─────────────────────────────────────────
    {
        id: 'admin',
        key: 'admin',
        title: 'Administration',
        icon: Shield,
        color: '#64748B',
        mode: 'both',
        items: [
            { label: "Paramètres", key: "settings", href: "/settings", icon: Settings, category: "settings" },
            { label: "Checklist Mise en Service", key: "onboarding_checklist", href: "/settings?tab=onboarding-checklist", icon: ClipboardCheck, category: "settings" },
            { label: "Intégrations", key: "integrations", href: "/integrations", icon: Plug, category: "settings", requiredCapability: "mod_settings" },
            { label: "Gestion des Accès", key: "access_management", href: "/account-settings", icon: UserCog, category: "account-settings" },
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

/** Filters nav items by tenant capabilities — hides items whose requiredCapability is false. */
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

interface SectionOverride { title?: string; items?: Record<string, string>; }

const VERTICAL_NAV_OVERRIDES: Record<string, Record<string, SectionOverride>> = {
    garage: {
        operations: { title: 'Atelier & Caisse', items: { floor_plan: 'Plan Atelier & Baies', operations: 'Ordres de Réparation (OR)' } },
        production: { title: 'Pièces & Déchets', items: { inventory: 'Pièces & Consommables', storage_map: 'Rayonnages & Casiers' } },
    },
    clinic: {
        operations: { title: 'Consultations & Caisse', items: { pos: 'Encaissement Actes CCAM', floor_plan: 'Plan des Cabinets' } },
        production: { title: 'Pharmacie & Matériel', items: { inventory: 'Dispositifs & Matériel' } },
    },
    salon: {
        operations: { title: 'Salon & Prestations', items: { pos: 'Caisse Prestations', floor_plan: 'Plan Fauteuils & Bacs' } },
        production: { title: 'Produits & Stocks', items: { inventory: 'Stock Cabine & Revente' } },
    },
    gym: {
        operations: { title: 'Club & Membres', items: { pos: 'Caisse & Forfaits', floor_plan: 'Plan Espaces & Plateaux' } },
        production: { title: 'Matériel & Nutrition', items: { inventory: 'Stocks & Équipements' } },
    },
    coworking: {
        operations: { title: 'Espaces & Réservations', items: { pos: 'Caisse & Pass', floor_plan: 'Plan Bureaux & Salles' } },
        production: { title: 'Fournitures & Boissons', items: { inventory: 'Stocks & Fournitures' } },
    },
    veterinary: {
        operations: { title: 'Clinique & Soins', items: { pos: 'Caisse Soins & Actes', floor_plan: 'Plan Salles Consultation' } },
        production: { title: 'Pharmacie & Matériel', items: { inventory: 'Médicaments & Dispositifs' } },
    },
    florist: {
        operations: { title: 'Boutique & Commandes', items: { pos: 'Caisse & Compositions', floor_plan: 'Plan Atelier & Serre' } },
        production: { title: 'Fleurs & Végétaux', items: { inventory: 'Tiges & Accessoires' } },
    },
};

const FOOD_ONLY_KEYS = ['bar', 'kitchen_management', 'kds', 'menu_builder', 'haccp', 'quality_control'];
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

