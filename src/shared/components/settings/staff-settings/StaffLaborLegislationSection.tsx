"use client";

import { motion } from "framer-motion";
import { Scale, Clock, Zap, Accessibility } from "lucide-react";
import type { StaffConfig } from "@nexus/contracts";

interface StaffLaborLegislationSectionProps {
    localConfig: StaffConfig;
    setLocalConfig: React.Dispatch<React.SetStateAction<StaffConfig>>;
}

export function StaffLaborLegislationSection({ localConfig, setLocalConfig }: StaffLaborLegislationSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative group"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

            <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                    <Scale className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                        Législation du Travail
                    </h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Protocoles de Conformité IA</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                <div className="bg-bg-primary p-8 rounded-[2rem] border border-border shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-text-muted" />
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Plafond Hebdomadaire</label>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={localConfig.maxHoursPerWeek}
                            onChange={(e) => setLocalConfig(s => ({ ...s, maxHoursPerWeek: Number(e.target.value) }))}
                            className="w-full bg-transparent text-3xl font-serif text-text-primary outline-none pr-16"
                            data-tutorial="settings-1-1"
                        />
                        <span className="absolute right-0 bottom-1.5 text-xs font-bold text-text-muted uppercase">Heures</span>
                    </div>
                </div>
                <div className="bg-bg-primary p-8 rounded-[2rem] border border-border shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-text-muted" />
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Limite Heures Sup.</label>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={localConfig.maxOvertimePerWeek}
                            onChange={(e) => setLocalConfig(s => ({ ...s, maxOvertimePerWeek: Number(e.target.value) }))}
                            className="w-full bg-transparent text-3xl font-serif text-text-primary outline-none pr-16"
                        />
                        <span className="absolute right-0 bottom-1.5 text-xs font-bold text-text-muted uppercase">Heures</span>
                    </div>
                </div>
                <div className="bg-bg-primary p-8 rounded-[2rem] border border-border shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Accessibility className="w-5 h-5 text-text-muted" />
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Repos Inter-Service</label>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={localConfig.minRestBetweenShiftsHours}
                            onChange={(e) => setLocalConfig(s => ({ ...s, minRestBetweenShiftsHours: Number(e.target.value) }))}
                            className="w-full bg-transparent text-3xl font-serif text-text-primary outline-none pr-16"
                        />
                        <span className="absolute right-0 bottom-1.5 text-xs font-bold text-text-muted uppercase">Heures</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
