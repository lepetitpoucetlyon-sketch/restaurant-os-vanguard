"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ShieldAlert, XCircle } from 'lucide-react';
import { useFleet } from '@/shared/contexts/FleetContext';
import { Button } from '@ui/button';

export function TrainingOverlay() {
    const { isTrainingMode, toggleTrainingMode } = useFleet();

    if (!isTrainingMode) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[100] p-4 flex justify-center pointer-events-none"
            >
                <div className="bg-status-warning/10 backdrop-blur-2xl border border-action-primary/20 px-8 py-3 rounded-full flex items-center gap-6 shadow-[0_10px_40px_rgba(245,158,11,0.2)] pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-status-warning rounded-lg flex items-center justify-center animate-pulse">
                            <GraduationCap className="w-5 h-5 text-bg-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-status-warning uppercase tracking-[0.2em] leading-tight">VTC School Mode</p>
                            <p className="text-[9px] font-bold text-status-warning/60 uppercase tracking-widest">Environnement de Simulation Actif</p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-status-warning/20" />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <ShieldAlert className="w-3 h-3 text-status-warning" />
                             <span className="text-[9px] font-bold text-status-warning/80 uppercase tracking-widest">Fiscalité Sandbox : ON</span>
                        </div>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleTrainingMode}
                            className="h-8 bg-status-warning/20 hover:bg-status-warning/30 text-status-warning border border-action-primary/10 rounded-lg text-chip-label-sm group transition-all"
                        >
                            Quitter le Mode École
                            <XCircle className="w-3 h-3 ml-2 group-hover:rotate-90 transition-transform" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
