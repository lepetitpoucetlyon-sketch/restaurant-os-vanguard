// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/ui.foundations';
import { motion } from 'framer-motion';

interface QualityModuleLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export const QualityModuleLayout: React.FC<QualityModuleLayoutProps> = ({ 
    children, 
    title, 
    subtitle, 
    actions 
}) => {
    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex-col bg-bg-primary overflow-hidden pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-bg-secondary px-10 pt-10 pb-6 flex justify-between items-end border-b border-border shadow-sm">
                <div>
                    <h1 className="text-4xl font-serif font-black italic text-text-primary tracking-tighter">
                        {title}<span className="text-accent-gold not-italic">.</span>
                    </h1>
                    {subtitle && (
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mt-2 italic">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && <div className="flex gap-4">{actions}</div>}
            </div>
            <div className="flex-1 overflow-auto p-8 lg:p-12">
                {children}
            </div>
        </div>
    );
};
