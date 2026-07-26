
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
} from "lucide-react";

export type NavMode = 'tenant' | 'mcc' | 'both';

export interface NavItem {
    label: string;
    key: string;
    href: string;
    icon: LucideIcon;
    category: string;
    badge?: string;
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
            { label: "Console MCC", key: "mcc_console", href: "/admin/mcc", icon: Building2, category: "mcc" },
            { label: "Flotte & Tenants", key: "mcc_fleet", href: "/admin/mcc?tab=fleet", icon: Building2, category: "mcc" },
            { label: "Conformité", key: "mcc_compliance", href: "/admin/mcc?tab=compliance", icon: ShieldCheck, category: "mcc" },
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
            { label: "Point de vente", key: "pos", href: "/pos", icon: Store, category: "pos" },
            { label: "Éditeur de Carte", key: "menu_builder", href: "/menu-builder", icon: ChefHat, category: "pos" },
            { label: "Plan de salle", key: "floor_plan", href: "/floor-plan", icon: Map, category: "floor-plan" },
            { label: "Production (KDS)", key: "kds", href: "/kds", icon: ChefHat, category: "kds" },
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
            { label: "Réservations", key: "reservations", href: "/reservations", icon: CalendarDays, category: "reservations" },
            { label: "CRM Clients", key: "crm", href: "/crm", icon: Heart, category: "reservations" },
            { label: "Devis & Privatisation", key: "quotes", href: "/marketing?tab=quotes", icon: FileSpreadsheet, category: "reservations" },
            { label: "Groupes & Privatisation", key: "groups", href: "/groups", icon: PartyPopper, category: "reservations" },
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
            { label: "Gestion Cuisine", key: "kitchen_management", href: "/kitchen", icon: ChefHat, category: "kitchen" },
            { label: "Bar & Sommellerie", key: "bar", href: "/bar", icon: Wine, category: "kitchen" },
            { label: "Plan des Stockages", key: "storage_map", href: "/inventory?tab=storage", icon: Refrigerator, category: "inventory" },
            { label: "Stocks & Inventaire", key: "inventory", href: "/inventory", icon: Package, category: "inventory" },
            { label: "HACCP & Qualité", key: "haccp", href: "/haccp", icon: ClipboardCheck, category: "haccp" },
            { label: "Contrôle Réception", key: "quality_control", href: "/haccp?tab=quality", icon: ShieldCheck, category: "haccp" },
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
            { label: "Prise de Poste", key: "onboarding", href: "/welcome-staff", icon: Briefcase, category: "onboarding" },
            { label: "Ressources Humaines", key: "hr", href: "/staff?tab=team", icon: Users, category: "staff" },
            { label: "Planning", key: "planning", href: "/staff?tab=planning", icon: CalendarRange, category: "planning" },
            { label: "Congés & Absences", key: "leaves", href: "/staff?tab=leaves", icon: Palmtree, category: "planning" },
            { label: "Recrutement", key: "recruitment", href: "/staff?tab=recruitment", icon: UserPlus, category: "recruitment" },
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
            { label: "Analytique BI", key: "analytics", href: "/analytics", icon: BarChart3, category: "analytics" },
            { label: "Analyse Rentabilité", key: "google_analytics", href: "/analytics?tab=profitability", icon: BarChart3, category: "analytics" },
            { label: "Marketing & Social", key: "social_marketing", href: "/marketing", icon: Instagram, category: "analytics" },
            { label: "Référencement IA", key: "ai_referencing", href: "/marketing?tab=ai", icon: Bot, category: "analytics" },
            { label: "SEO & Référencement", key: "seo", href: "/marketing?tab=seo", icon: Globe, category: "analytics" },
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
            { label: "Trésorerie & Prévisions", key: "treasury", href: "/finance", icon: Wallet, category: "accounting" },
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
            { label: "Gestion Comptable", key: "accounting_management", href: "/finance?tab=accounting", icon: BookOpen, category: "accounting" },
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
            { label: "Registres & Conformité", key: "registre", href: "/registre", icon: ScrollText, category: "registre", badge: "OBLIGATOIRE" },
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
