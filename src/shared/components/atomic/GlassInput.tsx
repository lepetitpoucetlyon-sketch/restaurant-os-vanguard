"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    description?: string;
    icon?: React.ReactNode;
    error?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
    label,
    description,
    icon,
    error,
    className,
    ...props
}) => {
    return (
        <div className="flex flex-col space-y-2 w-full">
            {label && (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted">{label}</span>
                    {description && <span className="text-xs text-secondary">{description}</span>}
                </div>
            )}
            
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-status-warning transition-colors">
                        {icon}
                    </div>
                )}
                
                <input
                    className={cn(
                        "w-full bg-surface-sidebar/50 backdrop-blur-md border border-default/50 rounded-xl px-4 py-3",
                        "text-muted placeholder:text-secondary outline-none transition-all",
                        "focus:border-action-primary/50 focus:ring-1 focus:ring-action-primary/20 focus:bg-surface-sidebar/80",
                        icon && "pl-11",
                        error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20",
                        className
                    )}
                    {...props}
                />
            </div>
            
            {error && <span className="text-xs text-status-danger animate-pulse">{error}</span>}
        </div>
    );
};
