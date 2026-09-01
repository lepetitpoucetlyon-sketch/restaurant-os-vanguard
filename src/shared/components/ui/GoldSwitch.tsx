"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/ui.foundations';

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
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className="flex items-center justify-between group cursor-pointer w-full text-left bg-transparent border-0 p-0"
        >
            {(label || description) && (
                <div className="flex flex-col mr-4">
                    {label && <span className="text-sm font-medium text-text-muted group-hover:text-action-primary transition-colors">{label}</span>}
                    {description && <span className="text-xs text-text-muted/70">{description}</span>}
                </div>
            )}
            
            <div className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0",
                checked ? "bg-action-primary/20 ring-1 ring-action-primary/50" : "bg-surface-glass ring-1 ring-border-default",
                disabled && "opacity-50 cursor-not-allowed"
            )}>
                <motion.div
                    animate={{
                        x: checked ? 22 : 2,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                        "absolute top-[2px] w-5 h-5 rounded-full shadow-lg border border-border-subtle transition-colors duration-300",
                        checked ? "bg-action-primary" : "bg-text-muted"
                    )}
                />
            </div>
        </button>
    );
};
