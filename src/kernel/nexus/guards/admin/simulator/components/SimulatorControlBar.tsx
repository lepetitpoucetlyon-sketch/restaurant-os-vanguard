import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Cpu, Settings } from 'lucide-react';
import { GlassCard } from '@ui/GlassCard';
import { Button } from '@ui/button';

interface SimulatorControlBarProps {
    speed: number;
    setSpeed: (speed: number) => void;
    isRunning: boolean;
    isOverridesOpen: boolean;
    setIsOverridesOpen: (open: boolean) => void;
    handleStart: () => void;
    handleStop: () => void;
}

export function SimulatorControlBar({
    speed,
    setSpeed,
    isRunning,
    isOverridesOpen,
    setIsOverridesOpen,
    handleStart,
    handleStop
}: SimulatorControlBarProps) {
    return (
        <GlassCard className="p-4 flex items-center justify-between border-subtle hover:border-accent/30 transition-colors duration-500 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-6">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-70">Temporal Speed</span>
                    <div className="flex items-center gap-2">
                        {[1, 5, 20, 100].map(s => (
                            <motion.button 
                                key={s} 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSpeed(s)} 
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${speed === s ? 'bg-accent text-text-primary shadow-[0_0_15px_rgba(255,46,99,0.4)]' : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'}`}
                            >
                                {s}x
                            </motion.button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1 px-4 border-l border-subtle ml-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent opacity-70 flex items-center gap-2">
                        <Cpu size={10} />
                        Singularity Status
                    </span>
                    <span className="text-xs font-mono text-text-primary/90">ACTIVE_RESONANCE</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsOverridesOpen(!isOverridesOpen)}
                    className={`gap-2 text-[10px] uppercase font-black tracking-widest transition-all ${isOverridesOpen ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text-primary'}`}
                >
                    <Settings size={14} />
                    Overrides
                </Button>

                <AnimatePresence mode="wait">
                    {!isRunning ? (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Button onClick={handleStart} className="bg-success hover:bg-success/90 text-text-primary gap-2 px-8 shadow-xl shadow-success/20 group overflow-hidden relative">
                                <motion.div className="absolute inset-0 bg-surface-card/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <Play size={16} className="relative z-10" /> 
                                <span className="relative z-10">Initier l'Oracle</span>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stop"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Button onClick={handleStop} variant="destructive" className="gap-2 px-8 shadow-xl shadow-error/20 group">
                                <Square size={16} className="group-hover:scale-110 transition-transform" /> 
                                <span>Suspendre</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GlassCard>
    );
}
