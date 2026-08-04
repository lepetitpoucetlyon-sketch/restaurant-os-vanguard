import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowRight, Calendar, Key, CheckCircle2, User, Coffee } from 'lucide-react';
import { OperationalArea } from './types';

interface DashboardAreaModalProps {
    selectedArea: OperationalArea | null;
    setSelectedArea: (area: OperationalArea | null) => void;
    handleArrival: (area: OperationalArea) => void;
    updateAreaStatus: (id: string, status: string) => void;
}

export function DashboardAreaModal({ selectedArea, setSelectedArea, handleArrival, updateAreaStatus }: DashboardAreaModalProps) {
    return (
        <AnimatePresence>
            {selectedArea && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-surface-sidebar/5 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                        className="w-full max-w-4xl bg-[#FDFCF0] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border border-subtle overflow-hidden flex"
                    >
                        {/* Left Side: Hand-drawn Illustration Placeholder */}
                        <div className="w-2/5 p-12 border-r border-subtle bg-surface-card/30 relative">
                            <div className="absolute top-8 left-8">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Croquis de la Configuration</span>
                            </div>
                            <div className="w-full h-full rounded-2xl border-2 border-dashed border-subtle flex flex-col items-center justify-center text-center p-10">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-32 h-32 text-muted mb-6"
                                >
                                    <Home className="w-full h-full stroke-1" />
                                </motion.div>
                                <h4 className="text-lg font-black italic mb-2">Structure Master</h4>
                                <p className="text-xs text-muted italic font-sans leading-relaxed">
                                    Vue en perspective de l'agencement standard pour le type <strong>{selectedArea.type}</strong>.
                                    Inclut hall, salon et espace privatif.
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Data & Control */}
                        <div className="flex-1 p-16 space-y-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-4xl font-black italic tracking-tighter mb-2">Détails de l'Espace {selectedArea.number}</h2>
                                    <div className="flex gap-4 items-center">
                                        <div className="px-3 py-1 bg-surface-sidebar text-text-primary rounded-full text-[10px] font-bold uppercase tracking-widest italic">{selectedArea?.status}</div>
                                        <p className="text-xs text-muted font-sans font-bold uppercase tracking-widest">{selectedArea.type} Premium</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedArea(null)}
                                    className="w-12 h-12 rounded-2xl bg-surface-card border border-subtle flex items-center justify-center text-muted hover:text-primary hover:shadow-lg transition-all"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-2 italic flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-brand" /> Dernière Mise en Place
                                        </p>
                                        <p className="text-sm font-sans font-black italic">{new Date(selectedArea.lastCleaning).toLocaleDateString()} à {new Date(selectedArea.lastCleaning).toLocaleTimeString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-2 italic flex items-center gap-2">
                                            <Key className="w-3 h-3 text-status-warning" /> Disponibilité Immédiate
                                        </p>
                                        <p className="text-sm font-sans font-black italic">{selectedArea?.status === 'vacant' ? 'Oui, prêt pour accueil' : 'Non, procédure en cours'}</p>
                                    </div>
                                </div>

                                <div className="bg-surface-card/50 p-6 rounded-[2rem] border border-subtle italic space-y-4">
                                    <p className="text-xs text-secondary leading-relaxed">
                                        "Cette zone bénéficie d'un éclairage optimal. Recommandation : vérifier le dressage des couverts."
                                    </p>
                                    <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle2 className="w-4 h-4" /> Validé par Gouvernance
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-dashed border-subtle flex gap-4">
                                <button
                                    onClick={() => handleArrival(selectedArea)}
                                    className="h-14 px-8 bg-surface-sidebar text-text-primary rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <User className="w-4 h-4" /> Accueil Client
                                </button>
                                <button
                                    onClick={() => {
                                        updateAreaStatus(selectedArea.id, 'maintenance');
                                        setSelectedArea(null);
                                    }}
                                    className="h-14 px-8 border border-subtle rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-surface-card transition-all flex items-center gap-3"
                                >
                                    <Coffee className="w-4 h-4" /> Mise en Place
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
