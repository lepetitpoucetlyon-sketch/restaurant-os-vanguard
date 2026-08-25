"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Clock, Users, ShieldCheck, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { Customer } from "@nexus/contracts";

interface ReservationFormData {
    time: string;
    covers: number;
    tableId: string;
    date: string;
    tags: string[];
}

interface ReservationDetailsStepProps {
    formData: ReservationFormData;
    setFormData: React.Dispatch<React.SetStateAction<ReservationFormData>>;
    selectedCustomer: Customer | null;
    setStep: (s: number) => void;
}

const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    },
    exit: { opacity: 0, x: -20 }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" as const }
    }
};

export function ReservationDetailsStep({
    formData,
    setFormData,
    selectedCustomer,
    setStep,
}: ReservationDetailsStepProps) {
    return (
        <motion.div
            key="step2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-12"
        >
            <motion.div variants={itemVariants} className="flex items-center gap-6">
                <button onClick={() => setStep(1)} className="w-12 h-12 rounded-xl bg-bg-secondary hover:bg-bg-tertiary flex items-center justify-center transition-all border border-border">
                    <ChevronLeft className="w-5 h-5 text-text-primary" />
                </button>
                <div>
                    <p className="text-nano font-black text-text-muted uppercase tracking-[0.3em]">Client Référent</p>
                    <p className="text-3xl font-serif italic text-text-primary">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-10">
                <motion.div variants={itemVariants} className="space-y-4">
                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent" /> Heure de Service
                    </label>
                    <div className="relative group">
                        <input
                            type="time"
                            value={formData.time}
                            onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                            className="w-full h-16 bg-bg-secondary border border-border rounded-2xl px-8 text-2xl font-mono font-light text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                        />
                    </div>
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-4">
                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-accent" /> Volume Convives
                    </label>
                    <div className="flex items-center justify-between bg-bg-secondary border border-border rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center gap-6 w-full justify-between">
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, covers: Math.max(1, prev.covers - 1) }))}
                                className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-bg-primary transition-all font-black text-lg text-text-primary"
                            >-</button>
                            <span className="text-3xl font-mono font-light text-text-primary">{formData.covers}</span>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, covers: prev.covers + 1 }))}
                                className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-bg-primary transition-all font-black text-lg text-text-primary"
                            >+</button>
                        </div>
                    </div>
                    {formData.covers >= 5 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            Empreinte bancaire requise (Groupe ≥ 5)
                        </div>
                    )}
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="space-y-6">
                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-accent" /> Assignation Suggérée (Disponibilités Réelles)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {['t1', 't2', 't3', 't4', 't5', 't6'].map((tId, idx) => (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={tId}
                            onClick={() => setFormData(prev => ({ ...prev, tableId: tId }))}
                            className={cn(
                                "p-8 rounded-[2.5rem] border transition-all duration-300 text-center group relative overflow-hidden",
                                formData.tableId === tId
                                    ? "bg-accent border-accent text-bg-primary shadow-xl shadow-amber-500/10"
                                    : "bg-bg-secondary border-border hover:border-accent/20 hover:bg-bg-tertiary"
                            )}
                        >
                            <p className={cn("text-nano font-black tracking-widest mb-2 transition-colors", formData.tableId === tId ? "text-bg-primary/60" : "text-text-primary/40")}>UNITÉ D'ACCUEIL</p>
                            <p className="text-3xl font-serif font-black italic">#{tId.replace('t', '')}</p>

                            {formData.tableId === tId && (
                                <motion.div layoutId="table-check" className="absolute top-2 right-4">
                                    <Check className="w-5 h-5 text-bg-primary" />
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
