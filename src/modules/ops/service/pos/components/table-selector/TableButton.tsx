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
                    container: "bg-status-warning/5 border-orange-500 shadow-inner",
                    circle: "bg-status-warning/20 text-status-warning border-orange-500/30",
                    icon: "text-status-warning",
                    indicator: "bg-status-warning",
                    bar: "bg-status-warning",
                    spotlight: "bg-gradient-to-br from-status-warning/10 to-transparent"
                };
            case 'paying':
                return {
                    container: "bg-status-success/5 border-emerald-500 shadow-inner animate-pulse-subtle",
                    circle: "bg-status-success/20 text-status-success border-emerald-500/30",
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
                    container: "bg-action-primary/5 border-action-primary/30 hover:border-amber-400/60 hover:-translate-y-2 backdrop-blur-xl shadow-inner",
                    circle: "bg-action-primary/10 text-action-primary border-action-primary/30",
                    icon: "text-action-primary",
                    indicator: "bg-action-primary",
                    bar: "bg-action-primary",
                    spotlight: "bg-gradient-to-br from-amber-500/8 to-transparent"
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
                "group relative flex flex-col items-center justify-center min-h-[160px] md:min-h-[180px] rounded-[48px] border transition-all duration-700 overflow-hidden shadow-sm hover:shadow-2xl w-full",
                styles.container
            )}
        >
            {/* Museum Spotlight Effect */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                styles.spotlight
            )} />

            {/* Background subtle number */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 cursor-pointer pointer-events-none">
                <span className="text-9xl md:text-[140px] font-serif font-black text-text-primary italic">{table.number}</span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
                <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-serif font-bold text-3xl md:text-4xl transition-all duration-700 border",
                    styles.circle
                )}>
                    {table.number}
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-nano md:text-[12px] font-black text-text-muted uppercase tracking-[0.3em] group-hover:text-text-primary transition-colors">{lexicon.tableLabel}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <Users className={cn("w-3 md:w-3.5 h-3 md:h-3.5", styles.icon)} />
                        <span className="text-micro md:text-[13px] font-bold text-text-primary font-serif italic">{table.seats} Pers.</span>
                    </div>
                </div>
            </div>

            {/* Status Indicator */}
            {['seated', 'ordered', 'eating', 'paying'].includes(table.status) && (
                <div className="absolute top-6 right-6">
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full animate-pulse shadow-glow",
                        styles.indicator
                    )} />
                </div>
            )}

            {/* Dirty badge */}
            {table.status === 'dirty' && (
                <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-action-primary/15 border border-action-primary/30 rounded-full px-3 py-1">
                    <Sparkles className="w-3 h-3 text-action-primary" />
                    <span className="text-nano font-black uppercase tracking-[0.15em] text-action-primary">À nettoyer</span>
                </div>
            )}

            <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1.5 transition-all duration-700 opacity-10 md:opacity-0 group-hover:opacity-100",
                styles.bar
            )} />
        </button>
    );
}
