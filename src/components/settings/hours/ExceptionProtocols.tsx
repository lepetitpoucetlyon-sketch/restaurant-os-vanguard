"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Calendar, Plus, ArrowRight, Trash2 } from "lucide-react";
import { ClosedPeriod } from "@nexus/contracts";

interface ExceptionProtocolsProps {
    closedPeriods: ClosedPeriod[];
    onAdd: (period: Omit<ClosedPeriod, 'id' | 'isAnnual'>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const cinematicItem: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
};

export function ExceptionProtocols({ closedPeriods, onAdd, onDelete }: ExceptionProtocolsProps) {
    const [newPeriod, setNewPeriod] = useState({ startDate: '', endDate: '', reason: '' });

    const handleAdd = async () => {
        if (newPeriod.startDate && newPeriod.endDate && newPeriod.reason) {
            await onAdd(newPeriod);
            setNewPeriod({ startDate: '', endDate: '', reason: '' });
        }
    };

    return (
        <motion.div
            variants={cinematicItem}
            className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />

            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4 relative z-10">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/10 text-accent shadow-premium"
                    >
                        <Calendar className="w-7 h-7" />
                    </motion.div>
                    <div>
                        <h3 className="text-3xl font-serif text-text-primary uppercase tracking-tighter italic">
                            Interruptions Temporelles
                        </h3>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] ml-1">Calibration des Fenêtres de Service Exceptionnelles</p>
                    </div>
                </div>
            </div>

            {/* Exceptional Entry */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 p-4 bg-bg-primary rounded-[2rem] border border-border shadow-inner mb-8">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-2">Date de Début</label>
                    <input
                        type="date"
                        value={newPeriod.startDate}
                        onChange={(e) => setNewPeriod(p => ({ ...p, startDate: e.target.value }))}
                        className="w-full px-5 py-4 bg-bg-tertiary border border-border text-sm font-serif italic outline-none focus:border-accent/50 transition-colors text-text-primary rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-2">Date de Fin</label>
                    <input
                        type="date"
                        value={newPeriod.endDate}
                        onChange={(e) => setNewPeriod(p => ({ ...p, endDate: e.target.value }))}
                        className="w-full px-5 py-4 bg-bg-tertiary border border-border text-sm font-serif italic outline-none focus:border-accent/50 transition-colors text-text-primary rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-2">Motif de Fermeture</label>
                    <input
                        type="text"
                        value={newPeriod.reason}
                        onChange={(e) => setNewPeriod(p => ({ ...p, reason: e.target.value }))}
                        placeholder="Ex : Travaux de Rénovation"
                        className="w-full px-5 py-4 bg-bg-tertiary border border-border text-sm font-serif italic outline-none focus:border-accent/50 transition-colors text-text-primary rounded-xl"
                    />
                </div>
                <div className="pt-5.5 flex items-end mb-1">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAdd}
                        className="w-14 h-14 bg-accent text-bg-primary rounded-2xl flex items-center justify-center shadow-lg hover:bg-accent/90 transition-colors"
                    >
                        <Plus className="w-6 h-6" />
                    </motion.button>
                </div>
            </div>

            {/* Exception List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {closedPeriods.map(period => (
                        <motion.div
                            key={period.id}
                            layoutId={period.id}
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            className="flex items-center justify-between p-6 bg-rose-500/5 backdrop-blur-md rounded-[2rem] border border-rose-500/10 shadow-sm"
                        >
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-xl font-serif font-bold text-rose-600 tracking-tighter">
                                            {new Date(period.startDate).toLocaleDateString('fr-FR', { day: '2-digit' })}
                                        </div>
                                        <div className="text-[9px] font-bold text-rose-400 uppercase">{new Date(period.startDate).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-rose-200" />
                                    <div className="text-center">
                                        <div className="text-xl font-serif font-bold text-rose-600 tracking-tighter">
                                            {new Date(period.endDate).toLocaleDateString('fr-FR', { day: '2-digit' })}
                                        </div>
                                        <div className="text-[9px] font-bold text-rose-400 uppercase">{new Date(period.endDate).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                                    </div>
                                </div>
                                <div className="hidden md:block w-px h-10 bg-rose-500/20" />
                                <div>
                                    <div className="text-sm font-serif font-bold text-text-primary uppercase tracking-tight italic">{period.reason}</div>
                                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                                        Durée : {Math.ceil((new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Jours
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onDelete(period.id)}
                                className="p-3 text-rose-500 rounded-xl transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </motion.button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {closedPeriods.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Aucun Protocole d'Exception Détecté</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
