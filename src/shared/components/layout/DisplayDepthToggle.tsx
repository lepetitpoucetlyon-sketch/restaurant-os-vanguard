'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Layers, Sparkles, ShieldCheck } from 'lucide-react';
import { useDisplayDepth, type DisplayDepthLevel } from '@/shared/nexus/state/displayDepth';
import { cn } from '@/lib/ui.foundations';

const DEPTH_CONFIG: Record<
    DisplayDepthLevel,
    { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string; tooltip: string }
> = {
    essential: {
        label: 'Focus',
        icon: Zap,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        tooltip: '⚡ Mode Focus actif : vue épurée, pilote automatique sans dette comptable',
    },
    manager: {
        label: 'Gestion',
        icon: Layers,
        color: 'text-sky-400',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/30',
        tooltip: '📊 Mode Gestionnaire : rentabilité, stocks, plannings & marges',
    },
    enterprise: {
        label: 'Expert',
        icon: ShieldCheck,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        tooltip: '🔍 Mode Expert : Grand Livre, audits SHA-256, FEC 19 col, télémétrie IoT',
    },
};

export function DisplayDepthToggle({ className }: { className?: string }) {
    const { depth, isEssential, setNextDepth } = useDisplayDepth();
    const current = DEPTH_CONFIG[depth];
    const Icon = current.icon;

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {/* Bouton de bascule fluide */}
            <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={setNextDepth}
                title={current.tooltip}
                className={cn(
                    'relative h-9 px-3 flex items-center gap-2 rounded-full border transition-all duration-300 backdrop-blur-xl group overflow-hidden',
                    current.bg,
                    current.border
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Icon className={cn('w-4 h-4 transition-transform duration-300 group-hover:rotate-12', current.color)} />
                <span className="text-xs font-semibold text-text-primary tracking-wide">{current.label}</span>

                {/* Indicateur point lumineux */}
                <span className="relative flex h-2 w-2">
                    <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', current.bg)} />
                    <span className={cn('relative inline-flex rounded-full h-2 w-2', current.color.replace('text-', 'bg-'))} />
                </span>
            </motion.button>

            {/* Badge Pilote Automatique (visible quand mode Focus / Essentiel) */}
            <AnimatePresence>
                {isEssential && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -10 }}
                        className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-micro font-medium text-emerald-400"
                        title="Toutes les écritures comptables et mouvements de stock sont résolus par défaut sans intervention manuelle."
                    >
                        <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span>Pilote auto actif</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
