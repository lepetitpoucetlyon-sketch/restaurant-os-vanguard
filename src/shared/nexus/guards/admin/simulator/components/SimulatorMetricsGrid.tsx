import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Activity, Users } from 'lucide-react';
import { GlassCard } from '@ui/GlassCard';
import type { SimulationMetrics } from '@/modules/intelligence';

interface SimulatorMetricsGridProps {
    metrics: SimulationMetrics;
    history: number[];
    isRunning: boolean;
    formatCurrency: (cents: number) => string;
}

export function SimulatorMetricsGrid({ metrics, history, isRunning, formatCurrency }: SimulatorMetricsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profit Monitor with Smooth Sparkline */}
            <GlassCard className="p-5 flex flex-col gap-4 group hover:border-success/30 transition-all duration-500">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Chiffre d'Affaire</span>
                    <motion.div 
                        animate={isRunning ? { rotate: [0, 10, -10, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <DollarSign size={16} className="text-success" />
                    </motion.div>
                </div>
                <div className="flex items-end justify-between">
                    <motion.span 
                        key={metrics.totalRevenueCents}
                        initial={{ opacity: 0.8, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-serif italic text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                    >
                        {formatCurrency(metrics.totalRevenueCents)}
                    </motion.span>
                    <div className="w-24 h-12 relative opacity-50 group-hover:opacity-100 transition-opacity">
                        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                            <motion.path
                                d={history.length > 1 ? `M ${history.map((v, i) => `${(i / (history.length - 1)) * 100},${40 - (v / (Math.max(...history) || 1)) * 30}`).join(' L ')}` : ''}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="text-success"
                                animate={{ d: history.length > 1 ? `M ${history.map((v, i) => `${(i / (history.length - 1)) * 100},${40 - (v / (Math.max(...history) || 1)) * 30}`).join(' L ')}` : '' }}
                                transition={{ type: "spring", stiffness: 50 }}
                            />
                        </svg>
                    </div>
                </div>
            </GlassCard>

            {/* Stress Meter (Brigade) with Critical Glow */}
            <GlassCard className={`p-5 flex flex-col gap-4 transition-all duration-700 ${metrics.burnoutIndex > 75 ? 'border-error/40 shadow-[0_0_30px_rgba(239,68,68,0.15)] bg-error/5' : ''}`}>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stress-Meter (Brigade)</span>
                    <motion.div
                        animate={metrics.burnoutIndex > 75 ? { scale: [1, 1.2, 1], filter: ["blur(0px)", "blur(2px)", "blur(0px)"] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                    >
                        <Activity size={16} className={metrics.burnoutIndex > 75 ? 'text-error' : 'text-info'} />
                    </motion.div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="h-2 bg-surface-sidebar/20 rounded-full overflow-hidden border border-white/5 relative">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ 
                                width: `${metrics.burnoutIndex}%`,
                                backgroundColor: metrics.burnoutIndex > 75 ? '#ef4444' : metrics.burnoutIndex > 45 ? '#f59e0b' : '#3b82f6',
                                boxShadow: metrics.burnoutIndex > 75 ? '0 0 20px #ef4444' : 'none'
                            }} 
                            transition={{ type: "spring", bounce: 0.4 }}
                            className="h-full relative" 
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-text-muted">
                        <span className="tracking-tighter opacity-50">OPTIMAL FLOW</span>
                        <motion.span 
                            animate={metrics.burnoutIndex > 75 ? { color: '#ef4444' } : {}}
                            className="font-mono"
                        >
                            {metrics.burnoutIndex.toFixed(1)}%
                        </motion.span>
                        <span className="tracking-tighter opacity-50">CRITICAL LOAD</span>
                    </div>
                </div>
            </GlassCard>

            {/* Convives Count */}
            <GlassCard className="p-5 flex flex-col gap-2 hover:border-accent/30 transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Identités Actives</span>
                    <Users size={16} className="text-accent" />
                </div>
                <motion.span 
                    key={metrics.activeConvives}
                    initial={{ scale: 1.1 }}
                    className="text-3xl font-serif italic text-accent"
                >
                    {metrics.activeConvives}
                </motion.span>
            </GlassCard>
        </div>
    );
}
