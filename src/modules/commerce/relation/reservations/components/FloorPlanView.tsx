"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks";
import { Users } from "lucide-react";
import { cinematicItem, TABLES_DATA } from '../constants';
import type { FloorTable as Table } from "@/modules/ops";

interface FloorPlanViewProps {
    setSelectedTable: (table: Table) => void;
}

export function FloorPlanView({ setSelectedTable }: FloorPlanViewProps) {
    const { t } = useLanguage();

    return (
        <div className="p-4 md:p-8 pb-32">
            <div className="max-w-[1800px] mx-auto space-y-12">
                {Object.entries(TABLES_DATA).map(([zone, tableList]) => (
                    <div key={zone}>
                        <div className="flex items-center gap-4 mb-6">
                            {zone === 'VIP' && <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_15px_rgba(197,160,89,0.4)]" />}
                            {zone === 'TERRACE' && <div className="w-2.5 h-2.5 rounded-full bg-teal shadow-[0_0_15px_rgba(0,217,166,0.3)]" />}
                            {zone === 'STANDARD' && <div className="w-2.5 h-2.5 rounded-full bg-text-muted/20" />}
                            <span className={cn(
                                "text-nano font-black uppercase tracking-[0.3em]",
                                zone === 'VIP' ? "text-accent" : zone === 'TERRACE' ? "text-status-success" : "text-text-muted/60"
                            )}>{t('reservations.zones.zone')} {zone}</span>
                            <div className="h-px flex-1 bg-border/40" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {tableList.map((table: Table) => {
                                // Status Mapping for Style Consistency
                                const effectiveStatus =
                                    table.status === 'free' ? 'free' :
                                        table.status === 'seated' ? 'seated' :
                                            table.status;

                                const getStatusStyles = () => {
                                    switch (effectiveStatus) {
                                        case 'free':
                                            return {
                                                container: "bg-white/80 dark:bg-white/[0.03] border-white/20 dark:border-white/5 hover:border-accent/50 hover:-translate-y-2 backdrop-blur-xl",
                                                circle: "bg-bg-primary text-text-primary border-accent/20 group-hover:bg-accent group-hover:text-text-primary",
                                                icon: "text-accent",
                                                indicator: "bg-accent",
                                                bar: "bg-accent",
                                                spotlight: "bg-gradient-to-br from-accent/10 to-transparent"
                                            };
                                        case 'seated':
                                            return {
                                                container: "bg-accent/5 border-accent shadow-inner",
                                                circle: "bg-accent/20 text-accent border-accent/30",
                                                icon: "text-accent",
                                                indicator: "bg-accent",
                                                bar: "bg-accent",
                                                spotlight: "bg-gradient-to-br from-accent/10 to-transparent"
                                            };
                                        case 'reserved':
                                            return {
                                                container: "bg-purple-500/5 border-purple-500 shadow-inner",
                                                circle: "bg-purple-500/20 text-purple-500 border-purple-500/30",
                                                icon: "text-purple-500",
                                                indicator: "bg-purple-500",
                                                bar: "bg-purple-500",
                                                spotlight: "bg-gradient-to-br from-purple-500/10 to-transparent"
                                            };
                                        default:
                                            return {
                                                container: "bg-neutral-100 dark:bg-white/[0.01] border-border opacity-60 grayscale cursor-not-allowed",
                                                circle: "bg-neutral-200 text-text-secondary border-neutral-300",
                                                icon: "text-text-secondary",
                                                indicator: "bg-neutral-400",
                                                bar: "bg-neutral-400",
                                                spotlight: "bg-transparent"
                                            };
                                    }
                                };

                                const styles = getStatusStyles();

                                return (
                                    <motion.div
                                        key={table.id}
                                        variants={cinematicItem}
                                        onClick={() => setSelectedTable(table)}
                                        className={cn(
                                            "group relative flex flex-col items-center justify-center min-h-[160px] md:min-h-[180px] rounded-[48px] border transition-all duration-700 overflow-hidden shadow-sm hover:shadow-2xl cursor-pointer",
                                            styles.container
                                        )}
                                    >
                                        {/* Museum Spotlight Effect */}
                                        <div className={cn(
                                            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                                            styles.spotlight
                                        )} />

                                        {/* Background subtle number - Museum Style */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
                                            <span className="text-9xl font-serif font-black text-text-primary italic">{table.number}</span>
                                        </div>

                                        <div className="relative z-10 flex flex-col items-center gap-4">
                                            <div className={cn(
                                                "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-serif font-bold text-3xl md:text-4xl transition-all duration-700 border",
                                                styles.circle
                                            )}>
                                                {table.number}
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-nano md:text-[12px] font-black text-text-muted uppercase tracking-[0.3em] group-hover:text-text-primary transition-colors">Table</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Users className={cn("w-3 md:w-3.5 h-3 md:h-3.5", styles.icon)} />
                                                    <span className="text-micro md:text-[13px] font-bold text-text-primary font-serif italic">{table.seats} Pers.</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Premium Indicator */}
                                        {['seated', 'reserved'].includes(effectiveStatus) && (
                                            <div className="absolute top-6 right-6">
                                                <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full animate-pulse shadow-glow",
                                                    styles.indicator
                                                )} />
                                            </div>
                                        )}

                                        <div className={cn(
                                            "absolute bottom-0 left-0 right-0 h-1.5 transition-all duration-700 opacity-10 md:opacity-0 group-hover:opacity-100",
                                            styles.bar
                                        )} />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
