
import {
    Thermometer,
    Snowflake,
    Package,
    Wine,
    ChefHat,
    AlertTriangle,
    Calendar,
    Clock,
    X,
    ArrowRight,
    Refrigerator,
    Archive,
    Box,
    LucideIcon
} from "lucide-react";

export const STORAGE_TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bgColor: string; borderColor: string; label: string; gradient: string }> = {
    fridge: {
        icon: Refrigerator,
        color: '#3B82F6',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        label: 'Réfrigérateur',
        gradient: 'from-blue-500/20 to-blue-600/5'
    },
    freezer: {
        icon: Snowflake,
        color: '#8B5CF6',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/30',
        label: 'Congélateur',
        gradient: 'from-violet-500/20 to-violet-600/5'
    },
    dry_storage: {
        icon: Archive,
        color: '#F59E0B',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        label: 'Épicerie',
        gradient: 'from-amber-500/20 to-amber-600/5'
    },
    cellar: {
        icon: Wine,
        color: '#DC2626',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        label: 'Cave',
        gradient: 'from-red-500/20 to-red-600/5'
    },
    counter: {
        icon: ChefHat,
        color: '#10B981',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        label: 'Comptoir',
        gradient: 'from-emerald-500/20 to-emerald-600/5'
    },
    other: {
        icon: Box,
        color: '#6B7280',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        label: 'Autre',
        gradient: 'from-gray-500/20 to-gray-600/5'
    }
};
