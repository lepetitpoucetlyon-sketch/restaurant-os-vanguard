
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
    Book,
    BookOpen,
    Refrigerator,
    Palmtree,
    ShieldCheck,
    FileSpreadsheet,
    PartyPopper,
    UserPlus,
    ScrollText,
    Radio,
} from "lucide-react";
import type { CategoryKey } from "@/domain/services/AccessPolicyManager";

export interface NavItem {
    label: string;
    key: string;
    href: string;
    icon: LucideIcon;
    category: CategoryKey;
}

export interface NavSection {
    id: string;
    key: string;
    title: string;
    icon: LucideIcon;
    color: string;
    items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
    {
        id: 'main',
        key: 'main',
        title: 'Principal',
        icon: LayoutDashboard,
        color: '#C5A059', // Gold
        items: [
            { label: "Tableau de bord", key: "dashboard", href: "/", icon: LayoutDashboard, category: "dashboard" },
        ]
    },
    {
        id: 'intelligence',
        key: 'intelligence',
        title: 'Intelligence IA',
        icon: Sparkles,
        color: '#10B981', // Emerald
        items: [
            { label: "Intelligence Exécutive", key: "executive_intelligence", href: "/intelligence", icon: Sparkles, category: "analytics" },
            { label: "Cartographie 3D", key: "system_map", href: "/system-map", icon: Map, category: "analytics" },
        ]
    },
    {
        id: 'operations',
        key: 'operations',
        title: 'Opérations',
        icon: Utensils,
        color: '#3B82F6', // Blue
        items: [
            { label: "Point de vente", key: "pos", href: "/pos", icon: Store, category: "pos" },
            { label: "Plan de salle", key: "floor_plan", href: "/floor-plan", icon: Map, category: "floor-plan" },
            { label: "Production (KDS)", key: "kds", href: "/kds", icon: ChefHat, category: "kds" },
        ]
    },
    {
        id: 'clients',
        key: 'clients',
        title: 'Clients & Réservations',
        icon: Heart,
        color: '#EC4899', // Pink
        items: [
            { label: "Réservations", key: "reservations", href: "/reservations", icon: CalendarDays, category: "reservations" },
            { label: "Réservations Omnicanal", key: "omnichannel", href: "/omnichannel-reservations", icon: Globe, category: "reservations" },
            { label: "CRM Clients", key: "crm", href: "/crm", icon: Heart, category: "reservations" },
            { label: "Devis", key: "quotes", href: "/quotes", icon: FileSpreadsheet, category: "reservations" },
            { label: "Groupes & Privatisation", key: "groups", href: "/groups", icon: PartyPopper, category: "reservations" },
            { label: "Plan de Salle (Service)", key: "floor", href: "/floor", icon: Book, category: "operations" },
        ]
    },
    {
        id: 'production',
        key: 'production',
        title: 'Cuisine & Production',
        icon: ChefHat,
        color: '#F97316', // Orange
        items: [
            { label: "Gestion Cuisine", key: "kitchen_management", href: "/kitchen", icon: ChefHat, category: "kitchen" },
            { label: "Bar & Sommellerie", key: "bar", href: "/bar", icon: Wine, category: "kitchen" },
            { label: "Plan des Stockages", key: "storage_map", href: "/storage-map", icon: Refrigerator, category: "inventory" },
            { label: "Stocks & Inventaire", key: "inventory", href: "/inventory", icon: Package, category: "inventory" },
            { label: "HACCP & Qualité", key: "haccp", href: "/haccp", icon: ClipboardCheck, category: "haccp" },
            { label: "Contrôle Réception", key: "quality_control", href: "/quality", icon: ShieldCheck, category: "haccp" },
        ]
    },
    {
        id: 'team',
        key: 'team',
        title: 'Équipe & RH',
        icon: Users,
        color: '#06B6D4', // Cyan
        items: [
            { label: "Prise de Poste", key: "onboarding", href: "/onboarding", icon: Briefcase, category: "onboarding" },
            { label: "Ressources Humaines", key: "hr", href: "/staff", icon: Users, category: "staff" },
            { label: "Planning", key: "planning", href: "/planning", icon: CalendarRange, category: "planning" },
            { label: "Congés & Absences", key: "leaves", href: "/leaves", icon: Palmtree, category: "planning" },
            { label: "Recrutement", key: "recruitment", href: "/recruitment", icon: UserPlus, category: "recruitment" },
        ]
    },
    {
        id: 'analytics',
        key: 'marketing',
        title: 'Analytics & Marketing',
        icon: TrendingUp,
        color: '#8B5CF6', // Purple
        items: [
            { label: "Analytique BI", key: "analytics", href: "/analytics", icon: BarChart3, category: "analytics" },
            { label: "Google Analytics", key: "google_analytics", href: "/analytics-integration", icon: BarChart3, category: "analytics" },
            { label: "Marketing & Social", key: "social_marketing", href: "/social-marketing", icon: Instagram, category: "analytics" },
            { label: "Référencement IA", key: "ai_referencing", href: "/ai-referencing", icon: Bot, category: "analytics" },
            { label: "SEO & Référencement", key: "seo", href: "/seo", icon: Globe, category: "analytics" },
        ]
    },
    {
        id: 'finance',
        key: 'finance',
        title: 'Finance',
        icon: Wallet,
        color: '#EF4444', // Red
        items: [
            { label: "Trésorerie & Prévisions", key: "treasury", href: "/finance", icon: Wallet, category: "accounting" },
        ]
    },
    {
        id: 'accounting',
        key: 'accounting',
        title: 'Comptabilité',
        icon: BookOpen,
        color: '#F59E0B', // Amber
        items: [
            { label: "Gestion Comptable", key: "accounting_management", href: "/accounting", icon: BookOpen, category: "accounting" },
        ]
    },
    {
        id: 'registre',
        key: 'registre',
        title: 'Registres Obligatoires',
        icon: ScrollText,
        color: '#0EA5E9', // Sky
        items: [
            { label: "Registres & Conformité", key: "registre", href: "/registre", icon: ScrollText, category: "registre" },
        ]
    },
    {
        id: 'admin',
        key: 'admin',
        title: 'Administration',
        icon: Shield,
        color: '#64748B', // Slate
        items: [
            { label: "Paramètres", key: "settings", href: "/settings", icon: Settings, category: "settings" },
            { label: "Gestion des Accès", key: "access_management", href: "/account-settings", icon: UserCog, category: "account-settings" },
        ]
    },
    {
        id: 'master',
        key: 'master',
        title: 'Master Console',
        icon: Radio,
        color: '#F87171', // Red/Coral
        items: [
            { label: "Gestion de Flotte", key: "fleet_management", href: "/admin/master-console", icon: Radio, category: "settings" },
            { label: "Antigravity Intelligence", key: "agent_dashboard", href: "/admin/agent", icon: Bot, category: "analytics" },
        ]
    },
];
