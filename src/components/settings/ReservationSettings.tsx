"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import {
    BookOpen,
    Save,
    Loader2,
    Clock,
    Users,
    CreditCard,
    Mail,
    MessageSquare,
    AlertTriangle,
    Bell,
    FileText,
    Calendar,
    Target,
    Zap,
    ShieldCheck,
    History
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;

export default function ReservationSettingsComponent() {
    const { settings, updateReservationConfig, updateReservationSlots, isSaving } = useSettings();
    const [config, setConfig] = useState(settings.reservationConfig);
    const [slots, setSlots] = useState(settings.reservationSlots);

    useEffect(() => {
        setConfig(settings.reservationConfig);
        setSlots(settings.reservationSlots);
    }, [settings]);

    const handleSave = async () => {
        if (config) await updateReservationConfig?.(config as any);
        if (slots) await updateReservationSlots?.(slots);
    };

    const cinematicContainer: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const cinematicItem: Variants = {
        hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="space-y-12 pb-20"
        >
            {/* Temporal Horizons (Booking Windows) */}
            <motion.div
                variants={cinematicItem}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent"
                    >
                        <Calendar className="w-6 h-6" />
                    </motion.div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Temporal Horizons
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Booking Lead Times & Restrictions</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {[
                        { label: 'Minimum Lead', key: 'minAdvanceHours', unit: 'Hours', sub: 'Minimum notice' },
                        { label: 'Maximum Horizon', key: 'maxAdvanceDays', unit: 'Days', sub: 'Future projection' },
                        { label: 'Standard Occupancy', key: 'defaultDuration', unit: 'Min', sub: 'Table turnover time' }
                    ].map((item) => (
                        <div key={item.key} className="space-y-3">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">
                                {item.label}
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={config[item.key as keyof typeof config] as number}
                                    onChange={(e) => setConfig(c => ({ ...c, [item.key]: Number(e.target.value) }))}
                                    className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none focus:border-accent shadow-sm"
                                    data-tutorial={item.key === 'minAdvanceHours' ? 'settings-5-3' : undefined}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted uppercase tracking-widest pointer-events-none">
                                    {item.unit}
                                </span>
                            </div>
                            <p className="text-[9px] font-medium text-text-muted uppercase tracking-widest px-1 ml-1">{item.sub}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Capacity Matrix (Slot Configuration) */}
            <motion.div
                variants={cinematicItem}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center gap-4 mb-10">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: -10 }}
                        className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent"
                    >
                        <Target className="w-6 h-6" />
                    </motion.div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Capacity Matrix
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Load Balancing & Availability Slots</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">
                            Slot Granularity
                        </label>
                        <select
                            value={slots.slotDuration}
                            onChange={(e) => setSlots(s => ({ ...s, slotDuration: Number(e.target.value) }))}
                            className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none appearance-none shadow-sm"
                            data-tutorial="settings-5-4"
                        >
                            <option value={15} className="dark:bg-bg-secondary">15 Minutes (High Burst)</option>
                            <option value={30} className="dark:bg-bg-secondary">30 Minutes (Balanced)</option>
                            <option value={60} className="dark:bg-bg-secondary">60 Minutes (Steady Flow)</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">
                            Buffer Interval
                        </label>
                        <select
                            value={slots.intervalBetweenSlots}
                            onChange={(e) => setSlots(s => ({ ...s, intervalBetweenSlots: Number(e.target.value) }))}
                            className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none appearance-none shadow-sm"
                        >
                            <option value={0} className="dark:bg-bg-secondary">No Buffer (Zero Latency)</option>
                            <option value={15} className="dark:bg-bg-secondary">15 Minutes (Cleaning)</option>
                            <option value={30} className="dark:bg-bg-secondary">30 Minutes (Transition)</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">
                            Load Cap / Slot
                        </label>
                        <div className="relative group">
                            <input
                                type="number"
                                value={slots.maxCoversPerSlot}
                                onChange={(e) => setSlots(s => ({ ...s, maxCoversPerSlot: Number(e.target.value) }))}
                                className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none shadow-sm"
                            />
                            <Users className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Overbooking Logic */}
                <div className={cn(
                    "p-8 rounded-[2rem] border-2 transition-all duration-500",
                    config.overbookingAllowed
                        ? "bg-bg-primary border-accent/20 shadow-lg shadow-accent/5"
                        : "bg-bg-tertiary/20 border-border"
                )}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <motion.div
                                animate={config.overbookingAllowed ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                                transition={{ repeat: config.overbookingAllowed ? Infinity : 0, duration: 2 }}
                                className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg",
                                    config.overbookingAllowed ? "bg-accent text-bg-primary" : "bg-bg-tertiary text-text-muted"
                                )}
                            >
                                <AlertTriangle className="w-6 h-6" />
                            </motion.div>
                            <div>
                                <p className="font-serif text-text-primary uppercase tracking-tight italic">Stress-Test Protocols</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Exceed capacity limits by defined threshold</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setConfig(c => ({ ...c, overbookingAllowed: !c.overbookingAllowed }))}
                            className={cn(
                                "w-16 h-8 rounded-full relative transition-all duration-500",
                                config.overbookingAllowed ? "bg-accent shadow-lg shadow-accent/20" : "bg-bg-tertiary border border-border"
                            )}
                        >
                            <motion.div
                                animate={{ x: config.overbookingAllowed ? 34 : 2 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md z-10"
                            />
                        </button>
                    </div>

                    <AnimatePresence>
                        {config.overbookingAllowed && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Intensity Threshold (%)</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={config.overbookingPercent || 10}
                                                onChange={(e) => setConfig(c => ({ ...c, overbookingPercent: Number(e.target.value) }))}
                                                className="w-full px-6 py-4 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif transition-all outline-none"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-accent">%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-accent/5 rounded-2xl p-6 border border-accent/10">
                                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest leading-relaxed">
                                            Warning: Overbooking protocol activated. This targets higher occupancy at the cost of service pressure.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Verification Protocols (Deposit & Confirmation) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div
                    variants={cinematicItem}
                    className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 flex flex-col"
                >
                    <div className="flex items-center gap-4 mb-10">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: -180 }}
                            className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent"
                        >
                            <ShieldCheck className="w-6 h-6" />
                        </motion.div>
                        <div>
                            <h3 className="text-xl font-serif text-text-primary uppercase tracking-tight italic">
                                Verification Logic
                            </h3>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Confirmation & Collateral</p>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        {[
                            { id: 'autoConfirm', label: 'Autonomous approval', desc: 'No manual intervention', icon: Zap },
                            { id: 'requireDeposit', label: 'Financial Collateral', desc: 'Require deposit/guarantee', icon: CreditCard }
                        ].map((toggle) => (
                            <div key={toggle.id} className="p-6 bg-bg-primary rounded-[2rem] border border-border shadow-sm hover:shadow-md transition-all group/toggle">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <toggle.icon className="w-4 h-4 text-text-muted" />
                                        <p className="font-serif text-text-primary text-[10px] uppercase tracking-widest italic">{toggle.label}</p>
                                    </div>
                                    <button
                                        onClick={() => setConfig(c => ({ ...c, [toggle.id]: !c[toggle.id as keyof typeof c] }))}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-all duration-300",
                                            config[toggle.id as keyof typeof config] ? "bg-emerald-500" : "bg-bg-tertiary border border-border"
                                        )}
                                        data-tutorial={toggle.id === 'requireDeposit' ? 'settings-5-5' : undefined}
                                    >
                                        <motion.div
                                            animate={{ x: config[toggle.id as keyof typeof config] ? 26 : 2 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                        />
                                    </button>
                                </div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none opacity-80">{toggle.desc}</p>
                            </div>
                        ))}
                    </div>

                    {config.requireDeposit && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            className="mt-6 p-6 bg-bg-tertiary rounded-[2rem] border border-border space-y-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Unit</label>
                                    <select
                                        value={config.depositType || 'fixed'}
                                        onChange={(e) => setConfig(c => ({ ...c, depositType: e.target.value as 'fixed' | 'percent' }))}
                                        className="w-full px-4 py-3 bg-bg-primary border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none text-text-primary"
                                    >
                                        <option value="fixed" className="dark:bg-bg-secondary">Fixed</option>
                                        <option value="percent" className="dark:bg-bg-secondary">Percentage</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Value</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={config.depositAmount || 20}
                                            onChange={(e) => setConfig(c => ({ ...c, depositAmount: Number(e.target.value) }))}
                                            className="w-full px-4 py-3 bg-bg-primary border border-border rounded-xl text-[10px] font-bold outline-none text-text-primary"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-text-muted">{config.depositType === 'percent' ? '%' : '€'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Notifications & Latency (Reminders & No-show) */}
                <motion.div
                    variants={cinematicItem}
                    className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
                >
                    <div className="flex items-center gap-4 mb-10">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent"
                        >
                            <History className="w-6 h-6" />
                        </motion.div>
                        <div>
                            <h3 className="text-xl font-serif text-text-primary uppercase tracking-tight italic">
                                Synchronicity
                            </h3>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Reminders & Latency Handlers</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">
                                Email Dispatch Window
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[2, 4, 24, 48].map((h) => (
                                    <motion.button
                                        key={h}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setConfig(c => ({ ...c, emailReminderHours: h }))}
                                        className={cn(
                                            "py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border",
                                            config.emailReminderHours === h
                                                ? "bg-text-primary text-bg-primary border-text-primary shadow-lg"
                                                : "bg-bg-tertiary text-text-muted hover:text-text-primary border-border"
                                        )}
                                    >
                                        T-{h} Hours
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">
                                No-Show Tolerance
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[10, 15, 20, 30].map((m) => (
                                    <motion.button
                                        key={m}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setConfig(c => ({ ...c, noShowDelayMinutes: m }))}
                                        className={cn(
                                            "py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border",
                                            config.noShowDelayMinutes === m
                                                ? "bg-text-primary text-bg-primary border-text-primary shadow-lg"
                                                : "bg-bg-tertiary text-text-muted hover:text-text-primary border-border"
                                        )}
                                    >
                                        +{m} Minutes
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div >

            {/* Neural Scripting (Message Templates) */}
            < motion.div
                variants={cinematicItem}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center gap-4 mb-10">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent"
                    >
                        <MessageSquare className="w-6 h-6" />
                    </motion.div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Synthetic Output
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Automated Communication Scripts</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {[
                        { label: 'Approval Script', key: 'confirmationMessage', placeholder: 'Access granted. Your reservation is synchronized.' },
                        { label: 'Memory Reminder', key: 'reminderMessage', placeholder: 'Sub-routine reminder: Protocol active in 4 hours.' },
                        { label: 'Termination Policy', key: 'cancellationPolicy', placeholder: 'Erasure protocol: 24h notice required for system flush.' }
                    ].map((template) => (
                        <div key={template.key} className="space-y-3">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">
                                {template.label}
                            </label>
                            <textarea
                                value={config[template.key as keyof typeof config] as string}
                                onChange={(e) => setConfig(c => ({ ...c, [template.key]: e.target.value }))}
                                rows={2}
                                className="w-full px-8 py-6 bg-bg-tertiary border border-border rounded-[2rem] text-sm font-medium shadow-inner focus:bg-bg-primary transition-all outline-none resize-none text-text-primary placeholder:text-text-muted"
                                placeholder={template.placeholder}
                            />
                        </div>
                    ))}
                </div>
            </motion.div >

            {/* Global Dispatch */}
            < motion.div
                variants={cinematicItem}
                className="flex justify-end pt-4"
            >
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
                            <Save className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-white/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Commit Matrix Calibration
                </motion.button>
            </motion.div >
        </motion.div >
    );
}
