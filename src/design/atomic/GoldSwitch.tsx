"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GoldSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
}

export const GoldSwitch: React.FC<GoldSwitchProps> = ({
    checked,
    onChange,
    label,
    description,
    disabled = false
}) => {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => !disabled && onChange(!checked)}>
            {(label || description) && (
                <div className="flex flex-col mr-4">
                    {label && <span className="text-sm font-medium text-muted group-hover:text-status-warning transition-colors">{label}</span>}
                    {description && <span className="text-xs text-muted">{description}</span>}
                </div>
            )}
            
            <div className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
                checked ? "bg-status-warning/20 ring-1 ring-action-primary/50" : "bg-surface-sidebar ring-1 ring-default",
                disabled && "opacity-50 cursor-not-allowed"
            )}>
                <motion.div
                    animate={{
                        x: checked ? 22 : 2,
                        backgroundColor: checked ? "#F59E0B" : "#475569"
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-[2px] w-5 h-5 rounded-full shadow-lg border border-subtle"
                />
            </div>
        </div>
    );
};
