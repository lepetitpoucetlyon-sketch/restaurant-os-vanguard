// @wip owner:compliance-team échéance:2026-Q4 — écran HACCP à intégrer dans le flow qualité (audit orphelins 2026-08-30)
import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface HACCPBadgeProps {
    status: 'pass' | 'warning' | 'fail' | 'quarantine';
    size?: 'sm' | 'md' | 'lg';
}

export const HACCPBadge: React.FC<HACCPBadgeProps> = ({ status, size = 'md' }) => {
    const config = {
        pass: { icon: ShieldCheck, color: 'text-success bg-success/10 border-success/30', label: 'Conforme' },
        warning: { icon: ShieldAlert, color: 'text-warning bg-warning/10 border-warning/30', label: 'Alerte' },
        fail: { icon: ShieldX, color: 'text-error bg-error/10 border-error/30', label: 'Non-Conforme' },
        quarantine: { icon: ShieldAlert, color: 'text-brand bg-action-primary/10 border-focus/30', label: 'Quarantaine' }
    };

    const { icon: Icon, color, label } = config[status];

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full border font-black uppercase tracking-widest text-nano",
            color,
            size === 'sm' && "px-2 py-0.5 text-nano",
            size === 'lg' && "px-4 py-2 text-nano"
        )}>
            <Icon className={cn("w-3 h-3", size === 'sm' && "w-2.5 h-2.5", size === 'lg' && "w-4 h-4")} />
            {label}
        </div>
    );
};
