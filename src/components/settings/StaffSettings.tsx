"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Save,
    Loader2,
    Clock,
    Calendar,
    GraduationCap,
    Briefcase,
    AlertTriangle,
    Coffee,
    HeartPulse,
    Zap,
    Scale,
    Timer,
    Flame,
    Moon,
    Sun,
    Accessibility,
    BadgePercent,
    Activity
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;

import { useSettings } from "@/context/SettingsContext";
import { PositionSettings, StaffConfig } from "@nexus/contracts";

interface PositionConfig {
    id: string;
    name: string;
    color: string;
    hourlyRate: number;
    overtime: number;
    breakDuration: number;
}

const defaultPositions: PositionConfig[] = [
    { id: '1', name: 'Wait Staff', color: '#C5A572', hourlyRate: 12.50, overtime: 25, breakDuration: 30 },
    { id: '2', name: 'Rang Commander', color: '#1A1A1A', hourlyRate: 14.00, overtime: 25, breakDuration: 30 },
    { id: '3', name: 'Thermal Engineer', color: '#C5A572', hourlyRate: 13.50, overtime: 25, breakDuration: 45 },
    { id: '4', name: 'Tactical Chef', color: '#1A1A1A', hourlyRate: 18.00, overtime: 25, breakDuration: 45 },
    { id: '5', name: 'Mixologist', color: '#C5A572', hourlyRate: 13.00, overtime: 25, breakDuration: 30 },
    { id: '6', name: 'Material Sanitizer', color: '#1A1A1A', hourlyRate: 11.65, overtime: 25, breakDuration: 30 },
];

export default function StaffSettings() {
    const { settings, updateConfig, updateList, isSaving: contextIsSaving } = useSettings();
    const [positions, setPositions] = useState<PositionSettings[]>(settings?.positions || []);
    const [isSaving, setIsSaving] = useState(false);
    const [localConfig, setLocalConfig] = useState<StaffConfig>(settings?.staffConfig || {
        maxHoursPerWeek: 35,
        maxOvertimePerWeek: 8,
        minRestBetweenShiftsHours: 11,
        nightShiftStart: '22:00',
        nightShiftBonusPercent: 10,
        sundayBonusPercent: 25,
        holidayBonusPercent: 100,
        paidBreaks: true,
        autoScheduling: true,
        contractTypes: ['CDI', 'CDD', 'Extra', 'Interim', 'Training']
    });

    if (!settings) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateConfig('staffConfig', localConfig);
            await updateList('positions', positions);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const updatePosition = (id: string, updates: Partial<PositionSettings>) => {
        setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Labor Logic & Legislation */}
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

            {/* Compensation Multipliers (Bonuses) */}
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

            {/* Neural Position Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Postes & Rôles
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Paramétrage par Poste Opérationnel</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {positions.map((pos, idx) => (
                        <motion.div
                            key={pos.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + (idx * 0.05) }}
                            whileHover={{ scale: 1.02, y: -4 }}
                            className="p-8 rounded-[2.5rem] border border-border bg-bg-primary shadow-sm hover:shadow-lg hover:border-accent/40 transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="flex items-center gap-5 mb-8 relative z-10">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 bg-bg-tertiary text-accent"
                                >
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-serif text-text-primary uppercase tracking-tight text-xl italic">{pos.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Poste Opérationnel</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Taux Horaire</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={pos.minHourlyRate}
                                            onChange={(e) => updatePosition(pos.id, { minHourlyRate: Number(e.target.value) })}
                                            className="w-full px-4 py-4 bg-bg-tertiary/60 border border-border/50 rounded-2xl text-lg font-serif text-text-primary outline-none focus:bg-bg-tertiary transition-all shadow-inner"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">€</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Majoration HS</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={pos.overtimeRate}
                                            onChange={(e) => updatePosition(pos.id, { overtimeRate: Number(e.target.value) })}
                                            className="w-full px-4 py-4 bg-bg-tertiary/60 border border-border/50 rounded-2xl text-lg font-serif text-text-primary outline-none focus:bg-bg-tertiary transition-all shadow-inner"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Temps de Pause</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={pos.breakDuration}
                                            onChange={(e) => updatePosition(pos.id, { breakDuration: Number(e.target.value) })}
                                            className="w-full px-4 py-4 bg-bg-tertiary/60 border border-border/50 rounded-2xl text-lg font-serif text-text-primary outline-none focus:bg-bg-tertiary transition-all shadow-inner"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-text-muted uppercase">Min</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Global Dispatch */}
            <div className="flex justify-end pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                >
                    {isSaving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <div className="relative">
                            <Activity className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-surface-card/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Sauvegarder Configuration
                </motion.button>
            </div>
        </div>
    );
}
