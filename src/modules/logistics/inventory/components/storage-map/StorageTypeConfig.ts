
import {
    Snowflake,
    Wine,
    ChefHat,
    Refrigerator,
    Archive,
    Box,
    LucideIcon
} from "lucide-react";

export const STORAGE_TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bgColor: string; borderColor: string; label: string; gradient: string }> = {
    fridge: {
        icon: Refrigerator,
        color: '#3B82F6',
        bgColor: 'bg-action-primary/10',
        borderColor: 'border-focus/30',
        label: 'Réfrigérateur',
        gradient: 'from-action-primary/20 to-action-primary/5'
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
        bgColor: 'bg-status-warning/10',
        borderColor: 'border-amber-500/30',
        label: 'Épicerie',
        gradient: 'from-status-warning/20 to-status-warning/5'
    },
    cellar: {
        icon: Wine,
        color: '#DC2626',
        bgColor: 'bg-status-danger/10',
        borderColor: 'border-red-500/30',
        label: 'Cave',
        gradient: 'from-status-danger/20 to-status-danger/5'
    },
    counter: {
        icon: ChefHat,
        color: '#10B981',
        bgColor: 'bg-status-success/10',
        borderColor: 'border-emerald-500/30',
        label: 'Comptoir',
        gradient: 'from-status-success/20 to-status-success/5'
    },
    other: {
        icon: Box,
        color: '#6B7280',
        bgColor: 'bg-surface-tertiary/10',
        borderColor: 'border-default/30',
        label: 'Autre',
        gradient: 'from-surface-tertiary/20 to-surface-sidebar/5'
    }
};
