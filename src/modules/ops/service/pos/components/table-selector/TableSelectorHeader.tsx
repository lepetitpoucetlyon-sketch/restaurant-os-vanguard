"use client";

import { LayoutGrid, Layers } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { motion } from "framer-motion";
import { useLexicon } from "@/shared/hooks/useLexicon";
import type { Table } from "@nexus/contracts";

interface TableSelectorHeaderProps {
    tables: Table[];
    viewMode: 'grid' | 'zones';
    setViewMode: (v: 'grid' | 'zones') => void;
}

export function TableSelectorHeader({ tables, viewMode, setViewMode }: TableSelectorHeaderProps) {
    const lexicon = useLexicon();
    const activeCount = tables.filter((t) => (['seated', 'ordered', 'eating', 'paying'] as const).includes(t.status as 'seated')).length;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-action-primary">
                        Service Actif
                    </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                    Plan de {lexicon.tableLabel === 'Table' ? 'Salle' : lexicon.tableLabel}
                </h2>
            </div>

            <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-surface-card dark:bg-bg-secondary border border-border flex items-center gap-2 text-xs font-semibold text-text-secondary">
                    <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                    <span>{activeCount} / {tables.length} tables actives</span>
                </div>

                <div className="flex items-center bg-surface-card dark:bg-bg-secondary p-1 rounded-xl border border-border">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                            viewMode === 'grid'
                                ? "bg-action-primary text-text-on-primary shadow-sm"
                                : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Grille
                    </button>
                    <button
                        onClick={() => setViewMode('zones')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                            viewMode === 'zones'
                                ? "bg-action-primary text-text-on-primary shadow-sm"
                                : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Zones
                    </button>
                </div>
            </div>
        </div>
    );
}
