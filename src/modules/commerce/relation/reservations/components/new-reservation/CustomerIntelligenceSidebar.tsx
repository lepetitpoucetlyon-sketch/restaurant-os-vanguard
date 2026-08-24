"use client";

import { motion } from "framer-motion";
import { Tag, Sparkles, UserCheck, ArrowRight } from "lucide-react";
import { Button } from "@ui/button";
import type { Customer } from "@nexus/contracts";

interface CustomerIntelligenceSidebarProps {
    selectedCustomer: Customer | null;
    handleSubmit: () => void;
}

export function CustomerIntelligenceSidebar({
    selectedCustomer,
    handleSubmit,
}: CustomerIntelligenceSidebarProps) {
    return (
        <div className="w-[380px] bg-bg-secondary p-12 flex flex-col justify-between shrink-0 border-l border-border">
            <div className="space-y-10">
                {selectedCustomer ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-3 h-3 text-accent" /> Habits & Préférences
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedCustomer.preferences.map((pref: string, i: number) => (
                                    <span key={i} className="px-4 py-2 bg-surface-card dark:bg-surface-card/5 text-[10px] font-black text-text-primary dark:text-text-primary rounded-xl border border-border dark:border-white/5 uppercase tracking-widest shadow-sm">
                                        {pref}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-surface-card dark:bg-surface-card/5 border border-accent/20 relative overflow-hidden group shadow-sm">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 group-hover:bg-accent/10 transition-colors" />
                            <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2 italic">
                                <Sparkles className="w-3.5 h-3.5" /> Note de Service
                            </p>
                            <p className="text-[13px] text-text-primary dark:text-text-primary font-serif italic leading-relaxed">
                                &ldquo;Client habitué de la zone Alpha. Préfère l'eau minérale à température ambiante. Attention particulière sur le timing du service.&rdquo;
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-chip-label text-text-muted">
                                <span>Score Fidélité</span>
                                <span className="text-accent">Gold Member</span>
                            </div>
                            <div className="h-1.5 w-full bg-border dark:bg-surface-card/5 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-accent" />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-12 text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-surface-card dark:bg-surface-card/5 flex items-center justify-center mx-auto border border-dashed border-border dark:border-subtle shadow-sm">
                            <UserCheck strokeWidth={1} className="w-10 h-10 text-text-muted/50" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted max-w-[200px] mx-auto leading-relaxed italic">
                            Veuillez identifier un convive pour activer l'analyse prédictive.
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-text-muted">Disponibilité Salon</span>
                    <span className="text-teal flex items-center gap-2 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal" />
                        Optimale
                    </span>
                </div>

                <Button
                    disabled={!selectedCustomer}
                    onClick={handleSubmit}
                    data-tutorial="reservations-0-0-2"
                    className="w-full h-20 bg-accent hover:bg-surface-card text-bg-primary rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-amber-500/30 disabled:opacity-20 transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                    <ArrowRight className="w-5 h-5" />
                    Confirmer la Réservation
                </Button>
            </div>
        </div>
    );
}
