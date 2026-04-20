
import {
    BookOpen,
    FileText,
    Calculator,
    Scale,
    Wallet,
    Receipt,
    Building2,
    Users,
    CreditCard,
    TrendingUp,
    Landmark,
    FileCheck,
    FileClock,
    ClipboardCheck,
    BarChart3,
    Package,
    Truck,
    BadgeEuro,
    Calendar,
    LucideIcon,
    Shield,
    ArrowUpRight
} from "lucide-react";

export interface CategoryConfig {
    id: string;
    label: string;
    icon: LucideIcon;
    subcategories: SubcategoryConfig[];
}

export interface SubcategoryConfig {
    id: string;
    label: string;
    icon: LucideIcon;
    badge?: string;
}

export const ACCOUNTING_CATEGORIES: CategoryConfig[] = [
    {
        id: 'general',
        label: 'Comptabilité Générale',
        icon: BookOpen,
        subcategories: [
            { id: 'chart', label: 'Plan Comptable', icon: BookOpen },
            { id: 'ledger', label: 'Grand Livre', icon: FileText },
            { id: 'journal', label: 'Journal des Écritures', icon: Calculator },
            { id: 'balance', label: 'Balance Générale', icon: Scale },
        ]
    },
    {
        id: 'auxiliary',
        label: 'Comptabilité Auxiliaire',
        icon: Users,
        subcategories: [
            { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
            { id: 'customers', label: 'Clients', icon: Users },
            { id: 'employees', label: 'Personnel', icon: BadgeEuro },
        ]
    },
    {
        id: 'treasury',
        label: 'Trésorerie',
        icon: Wallet,
        subcategories: [
            { id: 'cash', label: 'Caisse & Banque', icon: CreditCard },
            { id: 'reconciliation', label: 'Rapprochement Bancaire', icon: ClipboardCheck },
            { id: 'forecast', label: 'Prévisions', icon: TrendingUp },
        ]
    },
    {
        id: 'taxes',
        label: 'Fiscalité',
        icon: Landmark,
        subcategories: [
            { id: 'tva', label: 'Déclaration TVA', icon: Receipt },
            { id: 'is', label: 'Impôt sur les Sociétés', icon: Building2 },
            { id: 'liasse', label: 'Liasse Fiscale', icon: FileCheck },
            { id: 'fec', label: 'Générateur FEC', icon: Shield, badge: 'Fiscal' },
        ]
    },
    {
        id: 'reports',
        label: 'États Financiers',
        icon: BarChart3,
        subcategories: [
            { id: 'pnl', label: 'Compte de Résultat', icon: TrendingUp },
            { id: 'balancesheet', label: 'Bilan', icon: Scale },
            { id: 'cashflow', label: 'Tableau de Flux', icon: ArrowUpRight },
            { id: 'analytics', label: 'Ratios & Analyses', icon: BarChart3 },
        ]
    },
    {
        id: 'closing',
        label: 'Clôtures',
        icon: FileClock,
        subcategories: [
            { id: 'monthly', label: 'Clôture Mensuelle', icon: Calendar },
            { id: 'annual', label: 'Clôture Annuelle', icon: FileCheck },
            { id: 'inventory', label: 'Inventaire', icon: Package },
        ]
    },
];

export const CLASS_LABELS: Record<string, { name: string; color: string }> = {
    '1': { name: 'Capitaux', color: 'bg-indigo-500' },
    '2': { name: 'Immobilisations', color: 'bg-amber-500' },
    '3': { name: 'Stocks', color: 'bg-emerald-500' },
    '4': { name: 'Tiers', color: 'bg-rose-500' },
    '5': { name: 'Financiers', color: 'bg-blue-500' },
    '6': { name: 'Charges', color: 'bg-red-500' },
    '7': { name: 'Produits', color: 'bg-green-500' },
};
