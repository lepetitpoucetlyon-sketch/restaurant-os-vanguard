"use client";

import { LayoutGrid, Layers } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { motion } from "framer-motion";
import type { Table } from "@nexus/contracts";

interface TableSelectorHeaderProps {
    tables: Table[];
    viewMode: 'grid' | 'zones';
    setViewMode: (v: 'grid' | 'zones') => void;
}

export function TableSelectorHeader({ tables, viewMode, setViewMode }: TableSelectorHeaderProps) {
    const activeCount = tables.filter((t) => (['seated', 'ordered', 'eating', 'paying'] as const).includes(t.status as 'seated')).length;

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col"
            >
                <span className="text-accent-gold text-[10px] font-black uppercase tracking-[0.4em] mb-2">Protocole Service</span>
                <h2 className="text-4xl md:text-5xl font-serif font-black text-text-primary tracking-tighter italic">
                    Plan de <span className="text-accent-gold not-italic">Salle</span>.
                </h2>
            </motion.div>

            <div className="flex items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="px-6 py-3 rounded-full bg-accent-gold/5 border border-accent-gold/20 text-accent-gold flex items-center gap-4 shadow-soft backdrop-blur-sm"
                >
                    <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                    <p className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                        {activeCount} / {tables.length} Actives
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="flex items-center bg-bg-secondary p-1 rounded-full border border-border shadow-soft"
                >
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-full text-chip-label-sm transition-all",
                            viewMode === 'grid'
                                ? "bg-surface-card dark:bg-surface-card text-primary dark:text-primary shadow-xl"
                                : "text-text-muted dark:text-text-primary/60 hover:text-text-primary dark:hover:text-text-primary"
                        )}
                    >
                        <LayoutGrid strokeWidth={2} className="w-3.5 h-3.5" />
                        Global
                    </button>
                    <button
                        onClick={() => setViewMode('zones')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-full text-chip-label-sm transition-all",
                            viewMode === 'zones'
                                ? "bg-surface-card dark:bg-surface-card text-primary dark:text-primary shadow-xl"
                                : "text-text-muted dark:text-text-primary/60 hover:text-text-primary dark:hover:text-text-primary"
                        )}
                    >
                        <Layers strokeWidth={2} className="w-3.5 h-3.5" />
                        Zones
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
