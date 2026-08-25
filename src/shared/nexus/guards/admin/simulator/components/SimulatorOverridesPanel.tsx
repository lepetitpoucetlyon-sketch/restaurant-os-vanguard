import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ChevronRight, Calculator } from 'lucide-react';
import { GlassCard } from '@ui/GlassCard';
import { Button } from '@ui/Button';
import { cn } from '@/lib/ui.foundations';

interface SimulatorOverridesPanelProps {
    isOverridesOpen: boolean;
    setIsOverridesOpen: (open: boolean) => void;
    staffRatio: number;
    updateStaffRatio: (ratio: number) => void;
    accountingMode: string;
    toggleAccountingMode: () => void;
    integrityStatus: 'IDLE' | 'VERIFYING' | 'SECURE' | 'BREACH';
}

export function SimulatorOverridesPanel({
    isOverridesOpen,
    setIsOverridesOpen,
    staffRatio,
    updateStaffRatio,
    accountingMode,
    toggleAccountingMode,
    integrityStatus
}: SimulatorOverridesPanelProps) {
    return (
        <AnimatePresence>
            {isOverridesOpen && (
                <motion.div
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    className="fixed top-24 right-8 z-50 w-72"
                >
                    <GlassCard className="p-6 border-accent/30 bg-surface-sidebar/80 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1">
                            <Button variant="ghost" size="sm" onClick={() => setIsOverridesOpen(false)} className="h-6 w-6 p-0 text-text-muted hover:text-text-primary">
                                <ChevronRight size={14} />
                            </Button>
                        </div>
                        
                        <div className="flex flex-col gap-8 relative z-10">
                            <div className="flex items-center gap-3 border-b border-subtle pb-4">
                                <Cpu size={18} className="text-accent animate-pulse" />
                                <span className="text-sm font-black uppercase tracking-widest text-text-primary">Singularity Overrides</span>
                            </div>

                            {/* Ratio Tuning */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-chip-label text-text-muted">Staffing Ratio</span>
                                    <span className="text-xs font-mono font-bold text-accent">1 : {staffRatio}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="15" 
                                    max="35" 
                                    step="1"
                                    value={staffRatio}
                                    onChange={(e) => updateStaffRatio(parseInt(e.target.value))}
                                    className="w-full accent-accent bg-surface-card/10 rounded-lg appearance-none h-1.5"
                                />
                                <div className="flex justify-between text-nano font-mono text-text-muted uppercase">
                                    <span>Palace</span>
                                    <span>Optimal</span>
                                    <span>Fast-Casual</span>
                                </div>
                            </div>

                            {/* Finance Toggle */}
                            <div className="flex flex-col gap-3">
                                <span className="text-chip-label text-text-muted">Financial Complexity</span>
                                <div className="grid grid-cols-2 gap-2 bg-surface-sidebar/40 p-1 rounded-xl border border-subtle">
                                    {['SIMPLE', 'EXPERT'].map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => toggleAccountingMode()}
                                            className={`py-2 rounded-lg text-chip-label transition-all ${
                                                accountingMode === mode 
                                                ? 'bg-accent text-text-primary shadow-lg shadow-accent/20' 
                                                : 'text-text-muted hover:text-text-primary'
                                            }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                {accountingMode === 'EXPERT' && (
                                    <div className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 rounded border transition-all duration-500",
                                        integrityStatus === 'SECURE' ? "bg-success/10 border-success/30" : 
                                        integrityStatus === 'BREACH' ? "bg-error/20 border-error/50 animate-pulse" :
                                        "bg-surface-card/5 border-subtle"
                                    )}>
                                        <Calculator size={10} className={cn(
                                            integrityStatus === 'SECURE' ? "text-success" : 
                                            integrityStatus === 'BREACH' ? "text-error" : "text-text-primary/50"
                                        )} />
                                        <span className={cn(
                                            "text-nano font-black uppercase tracking-widest",
                                            integrityStatus === 'SECURE' ? "text-success" : 
                                            integrityStatus === 'BREACH' ? "text-error" : "text-text-primary/50"
                                        )}>
                                            {integrityStatus === 'VERIFYING' ? 'Reconing...' : 
                                                integrityStatus === 'SECURE' ? 'Inquisiteur QA: SECURE' : 
                                                integrityStatus === 'BREACH' ? 'INTEGRITY BREACH' : 'Inquisiteur QA: IDLE'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 rounded-lg bg-surface-card/5 border border-subtle">
                                <p className="text-nano leading-relaxed text-text-muted italic">
                                    "Les réglages appliqués ici modifient la résonance de l'Oracle en temps réel."
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
