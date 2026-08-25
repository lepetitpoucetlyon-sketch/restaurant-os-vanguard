"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import type { PositionSettings } from "@nexus/contracts";

interface StaffPositionsSectionProps {
    positions: PositionSettings[];
    updatePosition: (id: string, updates: Partial<PositionSettings>) => void;
}

export function StaffPositionsSection({ positions, updatePosition }: StaffPositionsSectionProps) {
    return (
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
                    <p className="text-nano font-bold text-text-muted uppercase tracking-widest">Paramétrage par Poste Opérationnel</p>
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
                                    <p className="text-nano font-bold text-text-muted uppercase tracking-widest">Poste Opérationnel</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                            <div className="space-y-2">
                                <label className="block text-nano font-bold text-text-muted uppercase tracking-widest px-1">Taux Horaire</label>
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
                                <label className="block text-nano font-bold text-text-muted uppercase tracking-widest px-1">Majoration HS</label>
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
                                <label className="block text-nano font-bold text-text-muted uppercase tracking-widest px-1">Temps de Pause</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={pos.breakDuration}
                                        onChange={(e) => updatePosition(pos.id, { breakDuration: Number(e.target.value) })}
                                        className="w-full px-4 py-4 bg-bg-tertiary/60 border border-border/50 rounded-2xl text-lg font-serif text-text-primary outline-none focus:bg-bg-tertiary transition-all shadow-inner"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-nano font-bold text-text-muted uppercase">Min</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
