"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { Save, Loader2, Calendar, MessageSquare } from "lucide-react";
import {
    ReservationCapacitySection,
    ReservationVerificationSection,
    ReservationCardImprintSection,
    ReservationNotificationSection,
} from '@/modules/commerce';

export default function ReservationSettingsComponent() {
    const { settings, updateReservationConfig, updateReservationSlots, isSaving } = useSettings();
    const [config, setConfig] = useState(settings.reservationConfig);
    const [slots, setSlots]   = useState(settings.reservationSlots);

    useEffect(() => {
        setConfig(settings.reservationConfig);
        setSlots(settings.reservationSlots);
    }, [settings]);

    const handleSave = async () => {
        if (config) await updateReservationConfig?.(config as unknown as import('@/shared/nexus-contract').SovereignMap);
        if (slots)  await updateReservationSlots?.(slots);
    };

    const cinematicContainer: Variants = {
        hidden:  { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
    };

    const cinematicItem: Variants = {
        hidden:  { opacity: 0, y: 20, filter: "blur(10px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
    };

    return (
        <motion.div variants={cinematicContainer} initial="hidden" animate="visible" className="space-y-12 pb-20">

            {/* Temporal Horizons */}
            <motion.div variants={cinematicItem} className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />
                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <Calendar className="w-6 h-6" />
                    </motion.div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Temporal Horizons</h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Booking Lead Times &amp; Restrictions</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {[
                        { label: 'Minimum Lead',       key: 'minAdvanceHours', unit: 'Hours', sub: 'Minimum notice' },
                        { label: 'Maximum Horizon',    key: 'maxAdvanceDays',  unit: 'Days',  sub: 'Future projection' },
                        { label: 'Standard Occupancy', key: 'defaultDuration', unit: 'Min',   sub: 'Table turnover time' },
                    ].map((item) => (
                        <div key={item.key} className="space-y-3">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">{item.label}</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={config[item.key as keyof typeof config] as number}
                                    onChange={(e) => setConfig(c => ({ ...c, [item.key]: Number(e.target.value) }))}
                                    className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none focus:border-accent shadow-sm"
                                    data-tutorial={item.key === 'minAdvanceHours' ? 'settings-5-3' : undefined}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted uppercase tracking-widest pointer-events-none">{item.unit}</span>
                            </div>
                            <p className="text-[9px] font-medium text-text-muted uppercase tracking-widest px-1 ml-1">{item.sub}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            <ReservationCapacitySection config={config} setConfig={setConfig} slots={slots} setSlots={setSlots} />
            <ReservationVerificationSection config={config} setConfig={setConfig} />
            <ReservationCardImprintSection config={config} setConfig={setConfig} />
            <ReservationNotificationSection config={config} setConfig={setConfig} />

            {/* Neural Scripting (Message Templates) */}
            <motion.div variants={cinematicItem} className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10">
                <div className="flex items-center gap-4 mb-10">
                    <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <MessageSquare className="w-6 h-6" />
                    </motion.div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Synthetic Output</h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Automated Communication Scripts</p>
                    </div>
                </div>
                <div className="space-y-8">
                    {[
                        { label: 'Approval Script',    key: 'confirmationMessage', placeholder: 'Access granted. Your reservation is synchronized.' },
                        { label: 'Memory Reminder',    key: 'reminderMessage',     placeholder: 'Sub-routine reminder: Protocol active in 4 hours.' },
                        { label: 'Termination Policy', key: 'cancellationPolicy',  placeholder: 'Erasure protocol: 24h notice required for system flush.' },
                    ].map((template) => (
                        <div key={template.key} className="space-y-3">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">{template.label}</label>
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
            </motion.div>

            {/* Save */}
            <motion.div variants={cinematicItem} className="flex justify-end pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                >
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <div className="relative">
                            <Save className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-surface-card/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Commit Matrix Calibration
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
