"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Shield, 
    Bot, 
    Activity, 
    Cpu, 
    CheckCircle2, 
    AlertCircle, 
    Clock,
    Crosshair
} from 'lucide-react';
import { HermesEngine, type HermesPulseResult } from '@/modules/intelligence';
import { cn } from '@/lib/ui.foundations';

/**
 * 🏺 Hermes Dashboard - Grade X Command Center
 * Visualizes the heartbeat of the multi-agent system.
 */
export function HermesDashboard({ tenantId }: { tenantId: string }) {
    const [pulseResult, setPulseResult] = useState<HermesPulseResult | null>(null);
    const [isPulsing, setIsPulsing] = useState(false);
    const manifest = HermesEngine.getManifest();

    const triggerPulse = async () => {
        setIsPulsing(true);
        try {
            const result = await HermesEngine.pulse(tenantId);
            setPulseResult(result);
        } finally {
            // Artificial delay for "Wow effect" and sensory feedback
            setTimeout(() => setIsPulsing(false), 2000);
        }
    };

    // Auto-pulse on mount for demo
    useEffect(() => {
        triggerPulse();
    }, [tenantId]);

    return (
        <div className="space-y-8">
            {/* 📡 HEADER & PULSE TRIGGER */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-serif italic mb-2 flex items-center gap-4">
                        <Zap className={cn("w-6 h-6 text-accent", isPulsing && "animate-ping")} />
                        Hermes Vanguard Engine
                    </h3>
                    <p className="text-nano font-bold text-text-muted uppercase tracking-[0.3em]">
                        Autonomous Multi-Agent Orchestration • Grade X
                    </p>
                </div>

                <button 
                    aria-label="Déclencher pulsation Hermes"
                    onClick={triggerPulse}
                    disabled={isPulsing}
                    className="group relative px-6 py-3 bg-surface-glass border border-white/5 rounded-xl flex items-center gap-3 hover:bg-surface-glass-active transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {isPulsing ? (
                            <motion.div 
                                key="pulsing"
                                initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }}
                                className="flex items-center gap-3 text-chip-label-sm"
                            >
                                <Activity className="w-3.5 h-3.5 animate-pulse text-accent" />
                                Synchronizing...
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }}
                                className="flex items-center gap-3 text-chip-label-sm"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Trigger Global Pulse
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {/* 🛡️ VANGUARD TEAM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {manifest.activeAgents.map((agent) => (
                    <div key={agent.id} className="bg-surface-glass border border-white/5 rounded-[2rem] p-6 hover:border-accent/30 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AgentIcon id={agent.id} className="w-16 h-16" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                                <AgentIcon id={agent.id} className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest">{agent.id}</h4>
                                <span className="text-nano font-bold text-text-muted uppercase">{agent.domain} Agent</span>
                            </div>
                        </div>

                        <p className="text-nano text-text-secondary mb-6 leading-relaxed">
                            {agent.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-nano font-bold text-status-success uppercase">Operational</span>
                            </div>
                            <span className="text-nano font-mono text-text-muted/70">P{agent.priority} Registry</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 📊 PULSE RESULTS & ANOMALY FEED */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface-card border border-border rounded-[3rem] p-8 space-y-6">
                    <h4 className="text-nano font-black text-text-muted uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-accent" />
                        Anomaly Detection Feed
                    </h4>

                    {pulseResult?.anomalies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted/70 space-y-4">
                            <CheckCircle2 className="w-12 h-12 opacity-20" />
                            <p className="text-nano font-bold uppercase tracking-widest">No structural anomalies detected</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                            {pulseResult?.anomalies.map((anomaly) => (
                                <motion.div 
                                    key={anomaly.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 bg-surface-glass border border-white/5 rounded-2xl flex items-start gap-4 hover:bg-surface-glass-hover transition-all"
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        anomaly.severity === 'critical' ? "bg-status-danger/20 text-status-danger" : "bg-action-primary/20 text-action-primary"
                                    )}>
                                        <AlertCircle size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-nano font-black uppercase tracking-widest text-text-muted">{anomaly.domain}</span>
                                            <span className="text-nano font-mono text-text-muted/70 italic">ID: {anomaly.id.slice(0,8)}</span>
                                        </div>
                                        <p className="text-micro font-bold text-text-primary truncate">{anomaly.message}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Clock className="w-3 h-3 text-text-muted/70" />
                                            <span className="text-nano text-text-muted/70 font-bold uppercase">{new Date(anomaly.detectedAt).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-surface-card border border-border rounded-[3rem] p-8 space-y-6">
                    <h4 className="text-nano font-black text-text-muted uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-accent" />
                        Autonomous Corrective Chain
                    </h4>

                    {pulseResult?.actionsTaken.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted/70 space-y-4">
                            <Crosshair className="w-12 h-12 opacity-20" />
                            <p className="text-nano font-bold uppercase tracking-widest">Sovereign Guard Standby</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pulseResult?.actionsTaken.map((action, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex items-center gap-4"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-accent text-text-primary flex items-center justify-center shadow-lg shadow-accent/20">
                                        <Zap size={14} fill="currentColor" />
                                    </div>
                                    <p className="text-chip-label text-accent/80 italic">{action}</p>
                                </motion.div>
                            ))}
                            
                            <div className="pt-6 mt-6 border-t border-white/5">
                                <div className="p-6 bg-[#111111] rounded-2xl border border-white/5 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-nano font-black text-text-muted uppercase tracking-widest mb-2">Grade X Proof</p>
                                        <p className="text-xs text-text-secondary italic">"The system is now self-healing across Finance & HACCP boundaries. No human intervention was required for those corrections."</p>
                                    </div>
                                    <SparkleIcon className="absolute -bottom-4 -right-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AgentIcon({ id, className }: { id: string, className?: string }) {
    if (id === 'atlas') return <Shield className={className} />;
    if (id === 'themis') return <Shield className={className} />; // Replace with Law icon if available
    if (id === 'cronos') return <Bot className={className} />;
    return <Zap className={className} />;
}

function SparkleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M12 3V4M12 20V21M4 12H3M21 12H20M18.364 5.63604L17.6569 6.34315M6.34315 17.6569L5.63604 18.364M18.364 18.364L17.6569 17.6569M6.34315 6.34315L5.63604 5.63604" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}
