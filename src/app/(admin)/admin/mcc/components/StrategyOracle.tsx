"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Target, 
    ArrowRight, 
    BrainCircuit, 
    Sparkles, 
    TrendingUp,
    Terminal,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { useStrategicOracle } from '@/shared/hooks/useStrategicOracle';
import { useFleet } from '@/shared/contexts/FleetContext';
import { FleetInsight } from '@/modules/intelligence/services/MacroBrain';

export function StrategyOracle() {
    const { instances } = useFleet();
    const { insights, getExecutiveBriefing, executeAction, messages, isProcessing } = useStrategicOracle();
    // Gain projeté = 0 tant qu'aucune vente réelle n'a été encaissée
    const projectedGain = useMemo(() => {
        const monthlyRevenue = instances.reduce((sum, inst) => sum + Number(inst.metrics?.dailyRevenue ?? 0) * 30, 0);
        return monthlyRevenue > 0 ? Math.round(monthlyRevenue * 0.05) : 0;
    }, [instances]);

    return (
        <div className="space-y-8 pb-12">
            {/* 🌌 THE CONSTELLATION: Fleet Health Visualization */}
            <div className="relative h-[300px] bg-surface-card border border-border-subtle rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
                
                <div className="absolute top-6 left-8 z-10">
                    <h3 className="text-xs font-black text-text-primary/40 uppercase tracking-[0.3em] mb-1">Constellation de la Flotte</h3>
                    <p className="text-[10px] text-secondary font-medium tracking-tight">Distribution des nœuds en temps réel ({instances.length} unités)</p>
                </div>

                {/* Simulated Constellation Grid */}
                <div className="absolute inset-0 flex items-center justify-center p-12">
                     <div className="relative w-full h-full">
                        {instances.slice(0, 15).map((inst, i) => (
                            <motion.div
                                key={inst.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    position: 'absolute',
                                    left: `${(i * 17) % 90}%`,
                                    top: `${(i * 23) % 80}%`,
                                }}
                                className="group/node"
                            >
                                <div className={`w-3 h-3 rounded-full blur-[1px] ${inst.metrics.healthScore > 90 ? 'bg-status-success shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-status-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20">
                                    <div className="bg-surface-sidebar/90 border border-subtle px-2 py-1 rounded text-[8px] font-bold text-text-primary uppercase tracking-tighter">
                                        {inst.name} • {inst.metrics.healthScore}%
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {/* Connecting Lines (Simulated Neural Paths) */}
                        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                            <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="indigo" strokeWidth="0.5" />
                            <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="indigo" strokeWidth="0.5" />
                        </svg>
                     </div>
                </div>

                <div className="absolute bottom-6 right-8 flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">Normal Ops</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">Drift Detected</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* 🧠 STRATEGIC INSIGHTS STREAM */}
                <div className="col-span-12 lg:col-span-7 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="w-5 h-5 text-brand" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Oracle Predictions</h3>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-action-primary/10 border border-focus/20 text-[8px] font-black text-brand uppercase tracking-widest">
                            Autonomous Ready
                        </div>
                    </div>

                    <div className="space-y-4">
                        {insights.map((insight) => (
                            <InsightCard 
                                key={insight.id} 
                                insight={insight} 
                                onExecute={() => executeAction(insight)}
                            />
                        ))}
                    </div>
                </div>

                {/* 💬 EXECUTIVE TERMINAL */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-surface-card border border-border-subtle rounded-3xl p-8 flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-secondary" />
                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Strategy Briefing</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={getExecutiveBriefing}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-action-primary hover:bg-action-primary disabled:opacity-50 text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                <Sparkles className="w-3 h-3" />
                                {isProcessing ? 'Analyzing...' : 'Refresh Briefing'}
                            </motion.button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <BrainCircuit className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] font-medium max-w-[200px] leading-relaxed">
                                        REQUÊTE EN ATTENTE : INITIALISEZ LE BRIEFING POUR ANALYSER LA FLOTTE.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-surface-card border border-border-subtle hidden' : 'bg-action-primary/5 border border-focus/10'}`}>
                                        <p className="text-[11px] text-muted leading-relaxed font-medium">
                                            {msg.content}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-border-subtle">
                            <div className="flex items-center gap-4">
                                <TrendingUp className="w-4 h-4 text-status-success opacity-50" />
                                <div>
                                    <div className="text-[10px] font-black text-text-primary uppercase tracking-tight">Projected Collective Gain</div>
                                    <div className="text-xl font-black text-status-success tracking-tighter">€{projectedGain.toLocaleString()} <span className="text-[10px] text-status-success/50">/ mo</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InsightCard({ insight, onExecute }: { insight: FleetInsight, onExecute: () => void }) {
    const [status, setStatus] = useState<'idle' | 'executing' | 'done'>('idle');

    const handleExecute = async () => {
        setStatus('executing');
        await onExecute();
        setStatus('done');
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border transition-all ${insight.impact === 'CRITICAL' ? 'bg-status-danger/5 border-red-500/10' : 'bg-surface-card border-border-subtle'} flex gap-6 group hover:border-border-subtle`}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${insight.impact === 'CRITICAL' ? 'bg-status-danger/20 text-status-danger' : 'bg-action-primary/10 text-brand'}`}>
                {insight.type === 'anomaly' ? <AlertTriangle className="w-6 h-6" /> : <Target className="w-6 h-6" />}
            </div>

            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold uppercase tracking-tight group-hover:text-text-primary transition-colors">
                        {insight.title}
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-status-success">+{insight.confidence}% CONFIDENCE</span>
                        <div className="px-2 py-0.5 rounded bg-surface-card text-[8px] font-bold text-secondary uppercase tracking-widest">{insight.impact} IMPACT</div>
                    </div>
                </div>
                
                <p className="text-[11px] text-secondary leading-relaxed font-medium mb-6">
                    {insight.description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                         <div className="flex flex-col">
                             <span className="text-[8px] font-black text-secondary uppercase tracking-widest">Potential RoI</span>
                             <span className="text-xs font-black text-text-primary">€{insight.potentialRoI.toLocaleString()}</span>
                         </div>
                         <div className="w-px h-6 bg-surface-card" />
                         <div className="flex flex-col">
                             <span className="text-[8px] font-black text-secondary uppercase tracking-widest">Target Nodes</span>
                             <span className="text-xs font-black text-text-primary">{insight.affectedInstances.length} Units</span>
                         </div>
                    </div>

                    <button
                        onClick={handleExecute}
                        disabled={status !== 'idle'}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                            status === 'done' 
                            ? 'bg-status-success/20 text-status-success' 
                            : 'bg-surface-card hover:bg-surface-card text-primary shadow-[0_10px_20px_rgba(255,255,255,0.05)]'
                        }`}
                    >
                        {status === 'idle' && (
                            <>
                                {insight.action}
                                <ArrowRight className="w-3 h-3" />
                            </>
                        )}
                        {status === 'executing' && (
                            <>
                                Executing...
                            </>
                        )}
                        {status === 'done' && (
                            <>
                                <CheckCircle2 className="w-3 h-3" />
                                Action Complete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
