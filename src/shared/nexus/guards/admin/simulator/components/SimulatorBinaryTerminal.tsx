import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertCircle, Terminal } from 'lucide-react';
import { GlassCard } from '@ui/GlassCard';
import type {  SimulationMetrics  } from '@/bootstrap/legacy';;

interface SimulatorBinaryTerminalProps {
    metrics: SimulationMetrics;
    logs: {id: string, message: string, type: string, timestamp: string}[];
}

export function SimulatorBinaryTerminal({ metrics, logs }: SimulatorBinaryTerminalProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[300px]">
            {/* Yield Management Dashboard */}
            <GlassCard className={`flex flex-col overflow-hidden transition-all duration-700 ${metrics.burnoutIndex > 75 ? 'border-error/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] bg-error/5' : 'bg-surface-sidebar/40 border-white/5'} backdrop-blur-2xl relative group`}>
                <div className="border-b border-subtle p-4 flex items-center justify-between bg-surface-card/5">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-success animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-success/80">Nexus Yield Engine (Live)</span>
                    </div>
                    <AnimatePresence>
                        {metrics.burnoutIndex > 75 && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="px-2 py-0.5 rounded bg-error/20 border border-error/40 flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                            >
                                <AlertCircle size={10} className="text-error" />
                                <span className="text-[8px] font-mono text-error uppercase tracking-widest font-black">CRITICAL RUPTURE</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex-1 p-6 flex flex-col gap-6 relative">
                    {/* Red Glowing Alert (The Suzerain Order) */}
                    <AnimatePresence>
                        {metrics.burnoutIndex > 75 && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ 
                                    opacity: [1, 0.4, 1],
                                    scale: 1,
                                }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 bg-error/10 pointer-events-none z-0"
                            />
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50">Sovereign Pricing Velocity</span>
                        <div className="h-24 w-full flex items-end gap-1.5 overflow-hidden">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ height: "20%" }} 
                                    animate={{ height: `${20 + Math.random() * 60}%` }} 
                                    transition={{ repeat: Infinity, duration: 2 + Math.random(), repeatType: 'reverse' }}
                                    className={`flex-1 rounded-t-sm ${metrics.burnoutIndex > 75 ? 'bg-error/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-success/20'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl transition-colors duration-500 flex items-center justify-between relative z-10 ${metrics.burnoutIndex > 75 ? 'bg-error/10 border-error/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-success/5 border-success/10'}`}>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${metrics.burnoutIndex > 75 ? 'text-error' : 'text-success'}`}>
                                {metrics.burnoutIndex > 75 ? 'PROTOCOL BREACH' : 'YIELD STABLE'}
                            </span>
                            <span className="text-[8px] text-text-muted font-bold opacity-70 uppercase tracking-tighter mt-1">
                                {metrics.burnoutIndex > 75 ? 'Demand Surge Detected' : 'Velocity < Threshold'}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-xl font-serif italic ${metrics.burnoutIndex > 75 ? 'text-error' : 'text-success'}`}>
                                {metrics.burnoutIndex > 75 ? '+15%' : 'Standard'}
                            </span>
                            <span className="text-[8px] font-mono opacity-50 uppercase">Factor x{metrics.burnoutIndex > 75 ? '1.15' : '1.00'}</span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {metrics.burnoutIndex > 80 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-error/20 border border-error/30 flex items-center gap-3 relative z-10 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            >
                                <TrendingUp size={14} className="text-error animate-bounce" />
                                <span className="text-[9px] font-black text-error uppercase tracking-widest">Auto-Sourcing: Procurement PO#GRADE-X-ARCHIVE</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </GlassCard>

            <GlassCard className="flex flex-col overflow-hidden bg-surface-sidebar/60 backdrop-blur-2xl border-white/5">
                <div className="border-b border-subtle p-3 flex items-center justify-between bg-surface-card/5">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 mr-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-error/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent/80">Sovereign Terminal Stream v1.0.4</span>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                        <span className="text-[8px] font-mono text-accent uppercase tracking-widest">Grade X Engine</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 font-mono text-[10px] flex flex-col gap-2 leading-relaxed custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {logs.map(log => (
                            <motion.div key={log.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className={`flex gap-4 ${log.type === 'warn' ? 'text-warning' : log.type === 'error' ? 'text-error' : 'text-text-muted/80'}`}>
                                <span className="opacity-20 select-none">[{log.timestamp}]</span>
                                <span className="text-text-primary/90">
                                    <span className="text-accent mr-2 font-bold opacity-70">{" >> "}</span>
                                    {log.message}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {logs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted/20 gap-3 opacity-50">
                            <Terminal size={32} className="animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black">Waiting for Temporal Sequence...</span>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
