import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { differenceInDays, parseISO } from 'date-fns';

interface DLCAlertBadgeProps {
    expiryDate: string;
    className?: string;
}

export const DLCAlertBadge: React.FC<DLCAlertBadgeProps> = ({ expiryDate, className }) => {
    const daysRemaining = differenceInDays(parseISO(expiryDate), new Date());
    
    let status: 'safe' | 'warning' | 'critical' | 'expired' = 'safe';
    if (daysRemaining < 0) status = 'expired';
    else if (daysRemaining <= 1) status = 'critical';
    else if (daysRemaining <= 3) status = 'warning';

    const config = {
        safe: {
            color: 'text-status-success bg-status-success',
            icon: <CheckCircle className="w-3 h-3" />,
            label: `J+${daysRemaining}`
        },
        warning: {
            color: 'text-status-warning bg-status-warning',
            icon: <Clock className="w-3 h-3" />,
            label: `J+${daysRemaining}`
        },
        critical: {
            color: 'text-status-danger bg-status-danger animate-pulse',
            icon: <AlertCircle className="w-3 h-3" />,
            label: `URGENT (J+${daysRemaining})`
        },
        expired: {
            color: 'text-muted bg-surface-sidebar',
            icon: <AlertCircle className="w-3 h-3" />,
            label: 'EXPIRÉ'
        }
    };

    const current = config[status];

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm",
                current.color,
                status === 'critical' && "border-rose-100 shadow-rose-500/10",
                className
            )}
        >
            {current.icon}
            {current.label}
        </motion.div>
    );
};
