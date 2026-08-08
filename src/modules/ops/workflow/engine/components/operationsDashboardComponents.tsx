'use client';

/**
 * Sous-composants visuels purs de OperationsDashboard.
 * Aucun état React, aucune logique métier — purement présentationnels.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/ui.foundations";

// ── Notebook aesthetic helpers ─────────────────────────────────────────────────

export const SketchLine = ({ className }: { className?: string }) => (
    <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className={cn("h-[1px] bg-surface-tertiary origin-left", className)}
    />
);

export const HandDrawnBorder = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("relative p-6 border-2 border-default rounded-[2rem] bg-surface-card/50 backdrop-blur-sm shadow-sm", className)}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible text-border-default" viewBox="0 0 500 500" preserveAspectRatio="none">
            <motion.path
                d="M 20 0 Q 30 5 100 0 Q 200 -5 300 0 Q 450 5 480 0 L 500 20 Q 495 50 500 100 Q 505 200 500 300 Q 495 450 500 480 L 480 500 Q 450 495 300 500 Q 200 505 100 500 Q 30 495 20 500 L 0 480 Q 5 450 0 300 Q -5 200 0 100 Q 5 30 0 20 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />
        </svg>
        {children}
    </div>
);

// ── Mind Map ───────────────────────────────────────────────────────────────────

interface MindMapNodeProps {
    x: number;
    y: number;
    label: string;
    icon: React.ElementType;
    color: string;
    description?: string;
}

export const MindMapNode = ({ x, y, label, icon: Icon, color, description }: MindMapNodeProps) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ left: x, top: y }}
        className="absolute flex flex-col items-center group cursor-pointer"
    >
        <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-text-primary shadow-xl transition-all group-hover:scale-110 group-hover:shadow-2xl relative z-10", color)}>
            <Icon className="w-8 h-8" />
        </div>
        <div className="mt-4 bg-surface-card px-4 py-2 rounded-2xl border border-subtle shadow-xl transition-all group-hover:bg-surface-sidebar group-hover:text-text-primary relative z-10 w-48 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest block mb-1">{label}</span>
            {description && <p className="text-[9px] opacity-60 font-sans leading-tight hidden group-hover:block">{description}</p>}
        </div>
        <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={cn("absolute inset-0 -m-8 rounded-full border-2 border-dotted", color.replace('bg-', 'border-'))}
        />
    </motion.div>
);

export const HandDrawnLegend = ({ label, color }: { label: string; color: string }) => (
    <div className="flex items-center gap-2 bg-surface-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-subtle shadow-sm">
        <div className={cn("w-2 h-2 rounded-full", color.replace('text-', 'bg-'))} />
        <span className={cn("text-[10px] font-black uppercase tracking-widest", color)}>{label}</span>
    </div>
);

// ── Section cards ──────────────────────────────────────────────────────────────

interface ExplanatoryCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
}

export const ExplanatoryCard = ({ title, description, icon: Icon }: ExplanatoryCardProps) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-8 bg-surface-card rounded-[2.5rem] border border-subtle shadow-sm group relative overflow-hidden"
    >
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-24 h-24 rotate-12" />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-surface-bg flex items-center justify-center mb-6 group-hover:bg-surface-sidebar group-hover:text-text-primary transition-colors">
            <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-black italic mb-3">{title}</h4>
        <p className="text-xs text-muted leading-relaxed font-sans">{description}</p>
        <motion.div
            className="absolute bottom-6 left-8 right-8 h-[1px] bg-surface-bg"
            whileHover={{ backgroundColor: '#000' }}
        />
    </motion.div>
);
