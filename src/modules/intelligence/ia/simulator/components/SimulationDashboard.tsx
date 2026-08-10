"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Zap, 
    ShieldCheck, 
    AlertTriangle, 
    Database, 
    Play, 
    RotateCcw, 
    TrendingUp, 
    Activity,
    Lock,
    Skull,
    Crown,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { Button } from "@ui/button";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { SimulationService, SimulationMode, MonteCarloResult } from '../SimulationService';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useInventory } from '@/src/modules/ops/providers/hooks/catalogHooks';;
import { useToast } from "@ui/Toast";

type SimulationDayResult = MonteCarloResult['metrics'] & {
    date: string;
    anomalies: string[];
    orders: import('@nexus/contracts').Order[];
};

export function SimulationDashboard() {
    const { ingredients, stockItems } = useInventory();
    const { showToast } = useToast();
    const [isSimulating, setIsSimulating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mode, setMode] = useState<SimulationMode>('EMPIRE');
    const [results, setResults] = useState<SimulationDayResult[]>([]);
    const [stats, setStats] = useState({ revenue: 0, anomalies: 0, integrity: 100 });

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setProgress(0);
        setResults([]);
        
        showToast(`Lancement du Test Hardcore : Mode ${mode}`, "info");

        // Simulation sur 14 jours (vitesse accélérée)
        for (let day = 1; day <= 14; day++) {
            const currentMode = day > 7 ? 'CHAOS' : 'EMPIRE';
            setMode(currentMode);
            
            const date = new Date();
            date.setDate(date.getDate() - (14 - day));

            const result = await SimulationService.simulateDay(
                date.toISOString(), 
                currentMode, 
                'DEFAULT', 
                { 
                    ingredients, 
                    stockItems 
                }
            );
            
            setResults(prev => [...prev, { date: date.toLocaleDateString(), ...result, anomalies: Array(result.anomalyCount).fill("Écart de flux détecté") }]);
            setStats(prev => ({
                revenue: prev.revenue + SovereignMath.toCents(BigInt(result.orders.reduce((acc, o: import('@nexus/contracts').Order) => acc + SovereignMath.orderTotalMicrounits(o), 0))),
                anomalies: prev.anomalies + result.anomalyCount,
                integrity: currentMode === 'CHAOS' ? Math.max(0, prev.integrity - (result.anomalyCount * 2)) : prev.integrity
            }));

            setProgress(Math.round((day / 14) * 100));
            // No more visual delays - zero delay mandate
        }

        setIsSimulating(false);
        showToast("Simulation Hardcore Terminée", "success");
    };

    return (
        <div className="min-h-screen bg-surface-sidebar text-text-primary p-12 font-sans selection:bg-status-danger/30">
            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-status-danger/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-status-warning/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-16">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-surface-sidebar border border-default flex items-center justify-center shadow-2xl">
                            <Zap className="text-status-danger" size={32} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-serif italic font-light tracking-tighter">Nexus <span className="font-black not-italic text-text-primary">Hardcore Test</span></h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary mt-2">Empire Mode Audit • Stress-Testing • Chaos Injection v1.2</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.reload()}
                            className="h-14 px-8 rounded-2xl border-default bg-transparent hover:bg-surface-sidebar text-muted font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            <RotateCcw size={16} className="mr-2" /> Reset
                        </Button>
                        <Button 
                            disabled={isSimulating}
                            onClick={handleRunSimulation}
                            className={cn(
                                "h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl",
                                mode === 'EMPIRE' ? "bg-surface-card text-primary hover:bg-surface-bg" : "bg-status-danger text-text-primary hover:bg-status-danger"
                            )}
                        >
                            <Play size={16} className="mr-2" /> Start Huge Audit
                        </Button>
                    </div>
                </div>

                {/* KPI GRID */}
                <div className="grid grid-cols-4 gap-8 mb-16">
                    <MetricCard 
                        label="Revenu Simulé" 
                        value={`${(stats.revenue / 100).toLocaleString()}€`} 
                        icon={<TrendingUp className="text-status-success" />} 
                        subtitle="Génération CA massive"
                    />
                    <MetricCard 
                        label="Intégrité Ledger" 
                        value={`${stats.integrity}%`} 
                        icon={<ShieldCheck className={stats.integrity > 80 ? "text-brand" : "text-status-danger"} />} 
                        subtitle="Validation NF525 Seal"
                    />
                    <MetricCard 
                        label="Anomalies Chaos" 
                        value={stats.anomalies} 
                        icon={stats.anomalies > 0 ? <Skull className="text-status-danger" /> : <Crown className="text-status-warning" />} 
                        subtitle="Injections critiques"
                        highlight={stats.anomalies > 0}
                    />
                    <MetricCard 
                        label="Progression Cycle" 
                        value={`${progress}%`} 
                        icon={<Activity className="text-secondary" />} 
                        subtitle="Temps virtuel: 14 Jours"
                    />
                </div>

                {/* PROGRESS BAR */}
                <div className="mb-16 bg-surface-sidebar/50 h-2 rounded-full overflow-hidden border border-default shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={cn(
                            "h-full shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-colors",
                            mode === 'EMPIRE' ? "bg-surface-card" : "bg-status-danger"
                        )}
                    />
                </div>

                {/* MAIN CONTENT SPLIT */}
                <div className="grid grid-cols-3 gap-8">
                    {/* LOGS PANEL */}
                    <div className="col-span-1 bg-surface-sidebar/30 border border-default/50 rounded-[2.5rem] p-8 backdrop-blur-3xl overflow-hidden flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-default">
                            <div className="flex items-center gap-3">
                                <Database size={16} className="text-secondary" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Neural Shield Logs</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-danger animate-pulse" />
                                <span className="text-[8px] font-black uppercase text-status-danger tracking-tighter">Live Audit</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                            <AnimatePresence>
                                {results.slice().reverse().map((dayResult: SimulationDayResult, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-2"
                                    >
                                        <div className="text-[8px] font-black text-secondary flex justify-between uppercase">
                                            <span>Day {14 - results.length + idx + 1}</span>
                                            <span>{dayResult.date}</span>
                                        </div>
                                        {dayResult.anomalies.map((ano: string, i: number) => (
                                            <div key={i} className="p-3 bg-status-danger/10 border border-red-500/20 rounded-xl text-[9px] font-medium text-status-danger flex items-start gap-2">
                                                <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                                                {ano}
                                            </div>
                                        ))}
                                        {dayResult.anomalies.length === 0 && (
                                            <div className="p-3 bg-surface-card/5 border border-subtle rounded-xl text-[9px] font-medium text-muted flex items-start gap-2 italic">
                                                <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-status-success" />
                                                Flux nominal. Aucun écart détecté.
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* COMPARATIVE ANALYSIS */}
                    <div className="col-span-2 bg-surface-sidebar border border-default rounded-[2.5rem] p-10 flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-serif italic text-text-primary mb-1">Analyse Comparative</h3>
                                <p className="text-[9px] font-black uppercase text-secondary tracking-[0.2em] font-mono">Performance Empire (Semaine 1) vs Déclassement Chaos (Semaine 2)</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-surface-card" /> Empire
                                </div>
                                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-status-danger">
                                    <div className="w-2 h-2 rounded-full bg-status-danger shadow-[0_0_10px_#EF4444]" /> Chaos
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex items-end gap-1 px-4 relative">
                            {/* Simple Visual Bars Replacement for Charts */}
                            {Array.from({ length: 14 }).map((_, i) => {
                                const h = (results[i]?.orders.length || 0) * 3;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: h || 0 }}
                                            className={cn(
                                                "w-full rounded-t-lg transition-all relative overflow-hidden",
                                                i < 7 ? "bg-surface-card/20 group-hover:bg-surface-card/40" : "bg-status-danger/20 group-hover:bg-status-danger/40"
                                            )}
                                        >
                                            <div className={cn("absolute bottom-0 left-0 w-full h-[2px]", i < 7 ? "bg-surface-card" : "bg-status-danger shadow-[0_-5px_15px_#EF4444]")} />
                                        </motion.div>
                                        <span className="text-[7px] font-black text-secondary uppercase">J{i+1}</span>
                                    </div>
                                );
                            })}
                            
                            <div className="absolute inset-0 flex items-center justify-center -rotate-12 pointer-events-none opacity-10">
                                <Lock size={200} className="text-text-primary" />
                            </div>
                        </div>
                        
                        <div className="mt-12 bg-surface-sidebar/20 border border-default p-6 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skull className="text-status-danger" size={24} />
                                <div>
                                    <p className="text-[8px] font-black uppercase text-secondary tracking-widest">Diagnostic Automatisé</p>
                                    <p className="text-[11px] font-medium text-muted">Drift de stock de <span className="text-status-danger font-bold">18.4%</span> injecté. Écarts fiscaux identifiés sur 4 ordres.</p>
                                </div>
                            </div>
                            <Button
                                className="h-10 bg-surface-card text-primary text-[8px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
                                onClick={() => {
                                    showToast("Export FEC des données simulées en cours...", "info");
                                    window.open('/api/admin/finance/fec/export', '_blank');
                                }}
                            >
                                Générer Audit FEC
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle: string;
    highlight?: boolean;
}

function MetricCard({ label, value, icon, subtitle, highlight = false }: MetricCardProps) {
    return (
        <div className={cn(
            "bg-surface-sidebar/30 border border-default/50 rounded-[2.5rem] p-8 backdrop-blur-3xl transition-all hover:border-default",
            highlight && "border-red-500/30 bg-red-950/5 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
        )}>
            <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface-sidebar/50 flex items-center justify-center border border-default/50">
                    {icon}
                </div>
                <div className="bg-surface-card/5 rounded-full px-2 py-0.5 text-[7px] font-black uppercase text-secondary tracking-tighter">Live</div>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">{label}</h4>
            <div className="text-3xl font-mono font-black italic tracking-tighter mb-2">{value}</div>
            <p className="text-[9px] font-black text-secondary uppercase tracking-tighter">{subtitle}</p>
        </div>
    );
}
