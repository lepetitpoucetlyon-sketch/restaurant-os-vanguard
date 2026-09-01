"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Coffee, ArrowRight, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { DaySchedule } from "@nexus/contracts";
import { TimeInput } from "./TimeInput";
import { DAYS_CONFIG } from "@/constants/scheduling";

interface DayRowProps {
    day: DaySchedule;
    config: typeof DAYS_CONFIG[0];
    onChange: (updates: Partial<DaySchedule>) => void;
    index: number;
}

export function DayRow({ day, config, onChange, index }: DayRowProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "group relative flex flex-col gap-8 xl:grid xl:grid-cols-[200px_1fr] 2xl:grid-cols-[240px_1fr] xl:gap-10 p-6 md:p-10 rounded-[3rem] md:rounded-[4rem] border transition-all duration-700 isolate",
                day.isOpen
                    ? "bg-surface-card/95 dark:bg-surface-card/40 backdrop-blur-3xl border-border-default shadow-[0_20px_50px_rgba(0,0,0,0.05)] z-0 hover:z-10 focus-within:z-50 focus-within:shadow-[0_40px_100px_rgba(0,0,0,0.1)] dark:focus-within:shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
                    : "bg-surface-glass border-transparent opacity-40 hover:opacity-100"
            )}
        >
            {/* Day Control */}
            <div className="flex items-center justify-between lg:flex-col lg:items-start lg:justify-center py-1 gap-6">
                <div>
                    <h4 className={cn(
                        "text-3xl md:text-4xl font-serif italic uppercase tracking-tighter mb-1 transition-all duration-500",
                        day.isOpen ? "text-text-primary" : "text-text-muted/50"
                    )}>
                        {config.label}
                    </h4>
                    <p className="text-nano font-black text-text-muted/60 uppercase tracking-[0.3em] ml-1">
                        {day.isOpen ? "Service Actif" : "Établissement Clos"}
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-surface-card/50 dark:bg-surface-card/[0.05] p-2 pr-6 rounded-full border border-border-default">
                    <button
                        type="button"
                        onClick={() => onChange({ isOpen: !day.isOpen })}
                        className={cn(
                            "w-16 h-10 rounded-full relative transition-all duration-700 shadow-inner group/toggle overflow-hidden",
                            day.isOpen ? "bg-accent shadow-[var(--shadow-glow-accent,0_0_20px_rgba(0,0,0,0.3))]" : "bg-surface-bg dark:bg-surface-card"
                        )}
                    >
                        <motion.div
                            animate={{ x: day.isOpen ? 26 : 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute top-1.5 left-1.5 w-7 h-7 bg-surface-card dark:bg-surface-bg rounded-full shadow-xl z-10 flex items-center justify-center"
                        >
                            <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", day.isOpen ? "bg-accent" : "bg-surface-tertiary")} />
                        </motion.div>
                        {day.isOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-gradient-to-r from-accent to-[#D4AF6A] opacity-80"
                            />
                        )}
                    </button>
                    <span className={cn(
                        "text-nano font-black uppercase tracking-[0.2em] transition-colors",
                        day.isOpen ? "text-accent" : "text-text-muted"
                    )}>
                        {day.isOpen ? "ON" : "OFF"}
                    </span>
                </div>
            </div>

            {/* Service Grid */}
            <div className="flex flex-col 2xl:flex-row gap-10 xl:gap-14 flex-1">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Lunch Segment */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border",
                                day.isOpen ? "bg-status-warning/10 border-action-primary/20 text-status-warning" : "bg-surface-bg dark:bg-surface-card/5 border-transparent text-text-muted")}>
                                <Sun strokeWidth={2.5} className="w-4 h-4" />
                            </div>
                            <span className="text-micro font-black text-text-muted dark:text-muted uppercase tracking-[0.3em]">Matinée & Midi</span>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4">
                            <TimeInput
                                value={day.lunchOpen || ''}
                                onChange={(v) => onChange({ lunchOpen: v })}
                                disabled={!day.isOpen}
                                icon={ArrowRight}
                                label="OUVERTURE"
                            />
                            <div className="w-6 h-px bg-surface-bg dark:bg-surface-card/10 shrink-0" />
                            <TimeInput
                                value={day.lunchClose || ''}
                                onChange={(v) => onChange({ lunchClose: v })}
                                disabled={!day.isOpen}
                                icon={ChevronRight}
                                label="FERMETURE"
                            />
                        </div>
                    </div>

                    {/* Dinner Segment */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border",
                                day.isOpen ? "bg-action-primary/10 border-focus/20 text-brand" : "bg-surface-bg dark:bg-surface-card/5 border-transparent text-text-muted")}>
                                <Moon strokeWidth={2.5} className="w-4 h-4" />
                            </div>
                            <span className="text-micro font-black text-text-muted dark:text-muted uppercase tracking-[0.3em]">Soirée & Cocktail</span>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4">
                            <TimeInput
                                value={day.dinnerOpen || ''}
                                onChange={(v) => onChange({ dinnerOpen: v })}
                                disabled={!day.isOpen}
                                icon={ArrowRight}
                                label="OUVERTURE"
                            />
                            <div className="w-6 h-px bg-surface-bg dark:bg-surface-card/10 shrink-0" />
                            <TimeInput
                                value={day.dinnerClose || ''}
                                onChange={(v) => onChange({ dinnerClose: v })}
                                disabled={!day.isOpen}
                                icon={ChevronRight}
                                label="FERMETURE"
                            />
                        </div>
                    </div>
                </div>

                <div className="hidden 2xl:block w-px h-24 bg-surface-bg dark:bg-surface-card/10 self-center" />
                <div className="h-px w-full bg-surface-bg dark:bg-surface-card/5 2xl:hidden" />

                <div className="space-y-6 lg:min-w-[200px]">
                    <div className="flex items-center gap-3 px-2">
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border",
                            day.isOpen ? "bg-status-danger/10 border-red-500/20 text-status-danger" : "bg-surface-bg dark:bg-surface-card/5 border-transparent text-text-muted")}>
                            <Coffee strokeWidth={2.5} className="w-4 h-4" />
                        </div>
                        <span className="text-micro font-black text-text-muted dark:text-muted uppercase tracking-[0.3em]">Fermeture Cuisine</span>
                    </div>
                    <TimeInput
                        value={day.lastKitchenOrder || ''}
                        onChange={(v) => onChange({ lastKitchenOrder: v })}
                        disabled={!day.isOpen}
                        icon={Clock}
                        label="DERNIÈRE COMMANDE"
                    />
                </div>
            </div>
        </motion.div>
    );
}
