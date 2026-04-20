// @ts-nocheck
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
        quarantine: { icon: ShieldAlert, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30', label: 'Quarantaine' }
    };

    const { icon: Icon, color, label } = config[status];

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full border font-black uppercase tracking-widest text-[9px]",
            color,
            size === 'sm' && "px-2 py-0.5 text-[8px]",
            size === 'lg' && "px-4 py-2 text-[10px]"
        )}>
            <Icon className={cn("w-3 h-3", size === 'sm' && "w-2.5 h-2.5", size === 'lg' && "w-4 h-4")} />
            {label}
        </div>
    );
};
