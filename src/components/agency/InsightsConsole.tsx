// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, ShieldCheck, Database, Zap, Activity } from 'lucide-react';
import { AgentReasoningStep } from '@/domain/agency/types';

interface InsightsConsoleProps {
    reasoning: AgentReasoningStep[];
    isAnalyzing: boolean;
    domain: string;
    modelId?: string;
}

export const InsightsConsole: React.FC<InsightsConsoleProps> = ({ reasoning, isAnalyzing, domain, modelId = 'GEMINI-1.5-FLASH' }) => {
    return (
        <div className="bg-black/90 rounded-3xl p-6 border border-white/10 backdrop-blur-3xl shadow-2xl overflow-hidden min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-gold/20 flex items-center justify-center border border-accent-gold/30">
                        <Activity className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                        <h3 className="text-white font-serif italic font-black text-lg tracking-tight uppercase">Expertise {domain}</h3>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Console de Diagnostic Système</p>
                    </div>
                </div>
                {isAnalyzing && (
                    <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20"
                    >
                        <Zap className="w-3 h-3 text-accent-gold animate-pulse" />
                        <span className="text-accent-gold text-[8px] font-black uppercase tracking-widest">Analyse en cours</span>
                    </motion.div>
                )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto elegant-scrollbar pr-2">
                <AnimatePresence mode="popLayout">
                    {reasoning.map((step, idx) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative pl-6 border-l border-white/10"
                        >
                            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent-gold shadow-[0_0_10px_rgba(197,160,89,0.8)]" />
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-accent-gold text-[8px] font-black uppercase tracking-widest">{step.action}</span>
                                <span className="text-white/20 text-[8px] font-mono">{new Date(step.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-white/80 text-[11px] font-serif leading-relaxed mb-1">{step.thought}</p>
                            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                <p className="text-white/40 text-[9px] italic flex items-center gap-2">
                                    <Database className="w-3 h-3" />
                                    {step.observation}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isAnalyzing && reasoning.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 opacity-20">
                        <Sparkles className="w-12 h-12 text-white mb-4 animate-spin-slow" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Initialisation du diagnostic...</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-success/60">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Expertise Sécurisée</span>
                </div>
                <div className="text-[9px] font-mono text-white/20 uppercase">
                    Moteur {modelId}
                </div>
            </div>
        </div>
    );
};

