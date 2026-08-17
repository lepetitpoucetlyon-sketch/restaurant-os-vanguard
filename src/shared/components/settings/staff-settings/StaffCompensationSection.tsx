"use client";

import { motion } from "framer-motion";
import {
    BadgePercent,
    Coffee,
    Timer,
    Flame,
    Moon,
    Sun,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { StaffConfig } from "@nexus/contracts";

interface StaffCompensationSectionProps {
    localConfig: StaffConfig;
    setLocalConfig: React.Dispatch<React.SetStateAction<StaffConfig>>;
}

export function StaffCompensationSection({ localConfig, setLocalConfig }: StaffCompensationSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
        >
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                    <BadgePercent className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                        Rémunération & Primes
                    </h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Majoration & Bonus Temporels</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 bg-bg-primary p-8 rounded-[2rem] border border-border">
                        <div className="flex items-center gap-3">
                            <Moon className="w-5 h-5 text-text-muted" />
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Début Heures de Nuit</label>
                        </div>
                        <input
                            type="time"
                            value={localConfig.nightShiftStart}
                            onChange={(e) => setLocalConfig(s => ({ ...s, nightShiftStart: e.target.value }))}
                            className="w-full bg-transparent text-3xl font-serif text-text-primary outline-none"
                        />
                    </div>
                    <div className="space-y-4 bg-bg-primary p-8 rounded-[2rem] border border-border">
                        <div className="flex items-center gap-3">
                            <Timer className="w-5 h-5 text-text-muted" />
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Prime de Nuit</label>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={localConfig.nightShiftBonusPercent}
                                onChange={(e) => setLocalConfig(s => ({ ...s, nightShiftBonusPercent: Number(e.target.value) }))}
                                className="w-full bg-transparent text-3xl font-serif text-text-primary outline-none pr-10"
                            />
                            <span className="absolute right-3 bottom-1.5 text-xs font-bold text-text-muted uppercase">%</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 bg-bg-primary p-8 rounded-[2rem] border border-border">
                        <div className="flex items-center gap-3">
                            <Sun className="w-5 h-5 text-text-muted" />
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Majoration Dimanche</label>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={localConfig.sundayBonusPercent}
                                onChange={(e) => setLocalConfig(s => ({ ...s, sundayBonusPercent: Number(e.target.value) }))}
                                className="w-full bg-transparent text-3xl font-serif text-text-primary outline-none pr-10"
                            />
                            <span className="absolute right-3 bottom-1.5 text-xs font-bold text-text-muted uppercase">%</span>
                        </div>
                    </div>
                    <div className="space-y-4 bg-bg-primary p-8 rounded-[2rem] border border-border">
                        <div className="flex items-center gap-3">
                            <Flame className="w-5 h-5 text-text-muted" />
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Majoration Jours Fériés</label>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={localConfig.holidayBonusPercent}
                                onChange={(e) => setLocalConfig(s => ({ ...s, holidayBonusPercent: Number(e.target.value) }))}
                                className="w-full bg-transparent text-3xl font-serif text-text-primary outline-none pr-10"
                            />
                            <span className="absolute right-3 bottom-1.5 text-xs font-bold text-text-muted uppercase">%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn(
                "p-8 rounded-[2rem] border transition-all duration-500 flex items-center justify-between group",
                localConfig.paidBreaks
                    ? "bg-bg-primary border-accent/20 shadow-lg text-text-primary"
                    : "bg-bg-tertiary/50 border-border opacity-80 hover:opacity-100 text-text-muted"
            )}>
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                        localConfig.paidBreaks ? "bg-accent text-bg-primary" : "bg-bg-tertiary text-text-muted"
                    )}>
                        <Coffee className="w-6 h-6" />
                    </div>
                    <div>
                        <p className={cn("font-serif text-lg uppercase tracking-tight italic", localConfig.paidBreaks ? "text-text-primary" : "text-text-muted")}>Pauses Payées</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Inclure les temps de pause dans les cycles de travail</p>
                    </div>
                </div>
                <button
                    onClick={() => setLocalConfig(s => ({ ...s, paidBreaks: !s.paidBreaks }))}
                    className={cn(
                        "w-16 h-8 rounded-full relative transition-all duration-500",
                        localConfig.paidBreaks ? "bg-status-success" : "bg-bg-tertiary border border-border"
                    )}
                >
                    <motion.div
                        animate={{ x: localConfig.paidBreaks ? 34 : 6 }}
                        className="absolute top-1 w-6 h-6 rounded-full bg-surface-card shadow-md transition-all"
                    />
                </button>
            </div>
        </motion.div>
    );
}
