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
                    <span className="text-sm font-medium text-slate-300">{label}</span>
                    {description && <span className="text-xs text-slate-500">{description}</span>}
                </div>
            )}
            
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                        {icon}
                    </div>
                )}
                
                <input
                    className={cn(
                        "w-full bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3",
                        "text-slate-100 placeholder:text-slate-600 outline-none transition-all",
                        "focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 focus:bg-slate-900/80",
                        icon && "pl-11",
                        error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20",
                        className
                    )}
                    {...props}
                />
            </div>
            
            {error && <span className="text-xs text-red-500 animate-pulse">{error}</span>}
        </div>
    );
};
