"use client";

import { Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLexicon } from "@/shared/hooks/useLexicon";
import type { Table } from "@nexus/contracts";

interface TableButtonProps {
    table: Table;
    index: number;
    onSelectTable: (tableId: string) => void;
}

export function TableButton({ table, index, onSelectTable }: TableButtonProps) {
    const lexicon = useLexicon();
    const getStatusStyles = () => {
        switch (table.status) {
            case 'free':
                return {
                    container: "bg-surface-card/80 dark:bg-surface-card/[0.03] border-default dark:border-white/5 hover:border-accent-gold/50 hover:-translate-y-2 backdrop-blur-xl",
                    circle: "bg-bg-primary text-text-primary border-accent-gold/20 group-hover:bg-accent-gold group-hover:text-text-primary",
                    icon: "text-accent-gold",
                    indicator: "bg-accent-gold",
                    bar: "bg-accent-gold",
                    spotlight: "bg-gradient-to-br from-accent-gold/10 to-transparent"
                };
            case 'seated':
                return {
                    container: "bg-accent-gold/5 border-accent-gold shadow-inner",
                    circle: "bg-accent-gold/20 text-accent-gold border-accent-gold/30",
                    icon: "text-accent-gold",
                    indicator: "bg-accent-gold",
                    bar: "bg-accent-gold",
                    spotlight: "bg-gradient-to-br from-accent-gold/10 to-transparent"
                };
            case 'ordered':
                return {
                    container: "bg-action-primary/5 border-focus shadow-inner",
                    circle: "bg-action-primary/20 text-brand border-focus/30",
                    icon: "text-brand",
                    indicator: "bg-action-primary",
                    bar: "bg-action-primary",
                    spotlight: "bg-gradient-to-br from-action-primary/10 to-transparent"
                };
            case 'eating':
                return {
                    container: "bg-status-warning/5 border-status-warning shadow-inner",
                    circle: "bg-status-warning/20 text-status-warning border-status-warning/30",
                    icon: "text-status-warning",
                    indicator: "bg-status-warning",
                    bar: "bg-status-warning",
                    spotlight: "bg-gradient-to-br from-status-warning/10 to-transparent"
                };
            case 'paying':
                return {
                    container: "bg-status-success/5 border-status-success shadow-inner animate-pulse-subtle",
                    circle: "bg-status-success/20 text-status-success border-status-success/30",
                    icon: "text-status-success",
                    indicator: "bg-status-success",
                    bar: "bg-status-success",
                    spotlight: "bg-gradient-to-br from-status-success/10 to-transparent"
                };
            case 'reserved':
                return {
                    container: "bg-action-primary/5 border-focus shadow-inner",
                    circle: "bg-action-primary/20 text-brand border-focus/30",
                    icon: "text-brand",
                    indicator: "bg-action-primary",
                    bar: "bg-action-primary",
                    spotlight: "bg-gradient-to-br from-action-primary/10 to-transparent"
                };
            case 'dirty':
                return {
                    container: "bg-action-primary/5 border-action-primary/30 hover:border-status-warning/60 hover:-translate-y-2 backdrop-blur-xl shadow-inner",
                    circle: "bg-action-primary/10 text-action-primary border-action-primary/30",
                    icon: "text-action-primary",
                    indicator: "bg-action-primary",
                    bar: "bg-action-primary",
                    spotlight: "bg-gradient-to-br from-status-warning/10 to-transparent"
                };
            default:
                return {
                    container: "bg-surface-bg dark:bg-surface-card/[0.01] border-border opacity-60 grayscale cursor-not-allowed",
                    circle: "bg-surface-bg text-muted border-default",
                    icon: "text-muted",
                    indicator: "bg-surface-tertiary",
                    bar: "bg-surface-tertiary",
                    spotlight: "bg-transparent"
                };
        }
    };

    const styles = getStatusStyles();

    return (
        <button
            key={table.id}
            onClick={() => onSelectTable(table.id)}
            data-tutorial={index === 0 ? "pos-0-0-0" : undefined}
            className={cn(
                "group relative flex flex-col justify-between p-5 min-h-[140px] rounded-2xl border transition-all duration-200 text-left overflow-hidden cursor-pointer",
                "bg-surface-card dark:bg-bg-secondary border-border/70 dark:border-white/10 hover:border-action-primary/60 hover:shadow-lg active:scale-[0.98]",
                table.status === 'paying' && "ring-2 ring-status-success/40 border-status-success",
                table.status === 'seated' && "ring-1 ring-accent/30"
            )}
        >
            {/* Top row: Table number + Status badge */}
            <div className="flex items-center justify-between w-full">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">
                        {table.number}
                    </span>
                    <span className="text-xs font-medium text-text-muted">
                        {lexicon.tableLabel}
                    </span>
                </div>

                {/* Status Pill */}
                <div className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5",
                    table.status === 'free' && "bg-status-success/10 text-status-success border border-emerald-500/20",
                    table.status === 'seated' && "bg-action-primary/10 text-action-primary border border-action-primary/20",
                    table.status === 'ordered' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                    table.status === 'eating' && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                    table.status === 'paying' && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse",
                    table.status === 'dirty' && "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                    table.status === 'reserved' && "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                )}>
                    <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        table.status === 'free' && "bg-status-success",
                        table.status === 'seated' && "bg-action-primary",
                        table.status === 'ordered' && "bg-blue-400",
                        table.status === 'eating' && "bg-amber-400",
                        table.status === 'paying' && "bg-emerald-400",
                        table.status === 'dirty' && "bg-rose-400",
                        table.status === 'reserved' && "bg-indigo-400"
                    )} />
                    {table.status === 'free' ? 'Libre' :
                     table.status === 'seated' ? 'Installé' :
                     table.status === 'ordered' ? 'Commandé' :
                     table.status === 'eating' ? 'En cours' :
                     table.status === 'paying' ? 'Addition' :
                     table.status === 'dirty' ? 'À nettoyer' : 'Réservé'}
                </div>
            </div>

            {/* Bottom row: Capacity and zone */}
            <div className="flex items-center justify-between w-full pt-3 border-t border-border/40 mt-4 text-text-muted text-xs">
                <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.seats} couverts</span>
                </div>

                {table.status === 'dirty' && (
                    <div className="flex items-center gap-1 text-rose-400 font-medium">
                        <Sparkles className="w-3 h-3" />
                        <span>Nettoyage</span>
                    </div>
                )}
            </div>
        </button>
    );
}
