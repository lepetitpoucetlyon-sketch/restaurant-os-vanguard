"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ShieldAlert, XCircle, RotateCcw } from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { cn } from '@/lib/ui.foundations';
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
                <div className="bg-amber-500/10 backdrop-blur-2xl border border-amber-500/20 px-8 py-3 rounded-full flex items-center gap-6 shadow-[0_10px_40px_rgba(245,158,11,0.2)] pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center animate-pulse">
                            <GraduationCap className="w-5 h-5 text-bg-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-tight">VTC School Mode</p>
                            <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest">Environnement de Simulation Actif</p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-amber-500/20" />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <ShieldAlert className="w-3 h-3 text-amber-400" />
                             <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-widest">Fiscalité Sandbox : ON</span>
                        </div>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleTrainingMode}
                            className="h-8 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/10 rounded-lg text-[9px] font-black uppercase tracking-widest group transition-all"
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
