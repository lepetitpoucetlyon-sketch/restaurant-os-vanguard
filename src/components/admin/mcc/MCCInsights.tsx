"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { fleetSnapshotAtom } from '@/store/operationalAtoms';
import { useFleet } from '@/context/FleetContext';

export function MCCInsights() {
    const { macroInsights, triggerRebalancing } = useFleet();
    const fleetState = useAtomValue(fleetSnapshotAtom) as any;

    if (!macroInsights || macroInsights.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Empire Intelligence</h3>
            </div>
            
            {macroInsights.map((insight, idx) => (
                <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 bg-[#161618] border border-indigo-500/20 rounded-3xl relative overflow-hidden group hover:border-indigo-500/40 transition-all"
                >
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />

                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${insight.type === 'anomaly' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                                {insight.type === 'anomaly' ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                ) : (
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                )}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{insight.type}</span>
                        </div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">Impact: {insight.impact}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2 leading-tight">{insight.title}</h4>
                    <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
                        {insight.description}
                    </p>

                    <button 
                        onClick={() => triggerRebalancing(insight)}
                        className="w-full py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all group-hover:border-indigo-500/30 active:scale-[0.98]"
                    >
                        {insight.action}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            ))}
        </div>
    );
}
