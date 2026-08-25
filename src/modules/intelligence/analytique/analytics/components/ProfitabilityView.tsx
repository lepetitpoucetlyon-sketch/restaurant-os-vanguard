"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AreaChart } from 'lucide-react';
import { Button } from '@ui/Button';
import { BottomSheet } from "@ui/BottomSheet";
import type { ProfitabilityAlert } from '../types';

// --- Profitability View ---





export const ProfitabilityView: React.FC<{ alerts: ProfitabilityAlert[] }> = ({ alerts }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }}
            className="space-y-4"
        >
            {alerts.map(alert => (
                <div key={alert.productId} className="bg-surface-bg dark:bg-bg-secondary p-6 rounded-[2.5rem] border border-border/50">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-xl font-serif font-black italic text-text-primary">{alert.productName}</h4>
                            <p className="text-nano font-black text-error uppercase tracking-widest mt-1">
                                Marge sous le seuil ({(alert.currentMarginBps / 100).toFixed(1)}%)
                            </p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-error" />
                    </div>
                    <div className="flex items-end justify-between bg-bg-tertiary p-5 rounded-3xl">
                        <div>
                            <p className="text-nano font-black uppercase opacity-40 mb-1">Prix Suggéré</p>
                            <div className="text-3xl font-serif italic text-accent-gold font-black">
                                {(alert.suggestedPriceInMicrounits / 1_000_000).toFixed(2)}€
                            </div>
                        </div>
                        <Button className="h-11 px-8 bg-text-primary text-text-primary rounded-xl text-chip-label-sm hover:bg-surface-sidebar transition-colors">
                            Appliquer
                        </Button>
                    </div>
                </div>
            ))}
        </motion.div>
    );
};

// --- Simulator View ---

export const SimulatorView: React.FC = () => {
    const [showSimulationSheet, setShowSimulationSheet] = useState(false);

    return (
        <>
            <motion.div 
                key="simulator" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-8"
            >
                <div className="w-32 h-32 rounded-[3rem] bg-accent-gold/10 flex items-center justify-center text-accent-gold relative">
                    <AreaChart className="w-16 h-16" strokeWidth={1} />
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }} 
                        className="absolute inset-0 border-2 border-dashed border-accent-gold/40 rounded-[3rem]" 
                    />
                </div>
                <div className="max-w-[280px]">
                    <h2 className="text-3xl font-serif font-black italic text-text-primary mb-2">Simulateur Alpha</h2>
                    <p className="text-sm font-light text-text-muted leading-relaxed">
                        Lancez des scénarios de jumeau numérique pour valider vos décisions stratégiques avant exécution.
                    </p>
                </div>
                <Button
                    onClick={() => setShowSimulationSheet(true)}
                    className="h-16 px-12 bg-text-primary text-text-primary rounded-2xl text-nano font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    Configurer Simulation
                </Button>
            </motion.div>

            <BottomSheet
                isOpen={showSimulationSheet}
                onClose={() => setShowSimulationSheet(false)}
                title="Simulation Engine"
                subtitle="Jumeau Numérique / Scenario Builder"
            >
                <div className="space-y-8 py-6">
                    <div className="space-y-3">
                        <label className="text-chip-label-sm text-text-muted px-2">Type de Scénario</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Augmentation Prix', 'Nouveau Menu', 'Events', 'Coupure Réseau'].map(s => (
                                <button key={s} className="h-14 rounded-2xl bg-bg-tertiary border border-border text-nano font-black uppercase text-text-muted hover:bg-bg-primary transition-all">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-chip-label-sm text-text-muted px-2">Impact Estimé</label>
                        <input type="range" className="w-full accent-accent-gold" />
                    </div>
                    <Button 
                        onClick={() => setShowSimulationSheet(false)} 
                        className="w-full h-16 bg-accent-gold text-bg-primary rounded-2xl text-chip-label"
                    >
                        Lancer l'Analyse
                    </Button>
                </div>
            </BottomSheet>
        </>
    );
};
