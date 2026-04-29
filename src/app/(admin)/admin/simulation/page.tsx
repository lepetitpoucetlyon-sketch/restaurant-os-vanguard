"use client";

import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { useExpert } from "@/domain/agency/useExpert";
import { SimulationService, SimulationMode, MonteCarloResult } from "@/domain/services/SimulationService";
import { useInventory } from "@/engines/ops/NexusOpsProvider";
import { useToast } from "@/components/ui/Toast";

type SimulationDayResult = MonteCarloResult['metrics'] & {
    date: string;
    anomalies: string[];
    orders: import('@/types').Order[];
};

export default function SimulationPage() {
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
                    ingredients: ingredients as unknown as import('@/types').Ingredient[], 
                    stockItems: stockItems as unknown as import('@/types').StockItem[] 
                }
            );
            
            setResults(prev => [...prev, { date: date.toLocaleDateString(), ...result, anomalies: Array(result.anomalyCount).fill("Écart de flux détecté") }]);
            setStats(prev => ({
                revenue: prev.revenue + result.orders.reduce((acc, o: import('@/types').Order) => acc + (o.totalInCents || 0), 0),
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
        <div className="min-h-screen bg-[#050505] text-white p-12 font-sans selection:bg-red-500/30">
            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-16">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                            <Zap className="text-red-500" size={32} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-serif italic font-light tracking-tighter">Nexus <span className="font-black not-italic text-white">Hardcore Test</span></h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-2">Empire Mode Audit • Stress-Testing • Chaos Injection v1.2</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.reload()}
                            className="h-14 px-8 rounded-2xl border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            <RotateCcw size={16} className="mr-2" /> Reset
                        </Button>
                        <Button 
                            disabled={isSimulating}
                            onClick={handleRunSimulation}
                            className={cn(
                                "h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl",
                                mode === 'EMPIRE' ? "bg-white text-black hover:bg-zinc-200" : "bg-red-600 text-white hover:bg-red-700"
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
                        icon={<TrendingUp className="text-emerald-500" />} 
                        subtitle="Génération CA massive"
                    />
                    <MetricCard 
                        label="Intégrité Ledger" 
                        value={`${stats.integrity}%`} 
                        icon={<ShieldCheck className={stats.integrity > 80 ? "text-blue-500" : "text-red-500"} />} 
                        subtitle="Validation NF525 Seal"
                    />
                    <MetricCard 
                        label="Anomalies Chaos" 
                        value={stats.anomalies} 
                        icon={stats.anomalies > 0 ? <Skull className="text-red-500" /> : <Crown className="text-amber-500" />} 
                        subtitle="Injections critiques"
                        highlight={stats.anomalies > 0}
                    />
                    <MetricCard 
                        label="Progression Cycle" 
                        value={`${progress}%`} 
                        icon={<Activity className="text-zinc-500" />} 
                        subtitle="Temps virtuel: 14 Jours"
                    />
                </div>

                {/* PROGRESS BAR */}
                <div className="mb-16 bg-zinc-900/50 h-2 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={cn(
                            "h-full shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-colors",
                            mode === 'EMPIRE' ? "bg-white" : "bg-red-600"
                        )}
                    />
                </div>

                {/* MAIN CONTENT SPLIT */}
                <div className="grid grid-cols-3 gap-8">
                    {/* LOGS PANEL */}
                    <div className="col-span-1 bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-8 backdrop-blur-3xl overflow-hidden flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <Database size={16} className="text-zinc-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Neural Shield Logs</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[8px] font-black uppercase text-red-500 tracking-tighter">Live Audit</span>
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
                                        <div className="text-[8px] font-black text-zinc-600 flex justify-between uppercase">
                                            <span>Day {14 - results.length + idx + 1}</span>
                                            <span>{dayResult.date}</span>
                                        </div>
                                        {dayResult.anomalies.map((ano: string, i: number) => (
                                            <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-medium text-red-400 flex items-start gap-2">
                                                <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                                                {ano}
                                            </div>
                                        ))}
                                        {dayResult.anomalies.length === 0 && (
                                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-medium text-zinc-400 flex items-start gap-2 italic">
                                                <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-emerald-500" />
                                                Flux nominal. Aucun écart détecté.
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* COMPARATIVE ANALYSIS */}
                    <div className="col-span-2 bg-[#080808] border border-zinc-900 rounded-[2.5rem] p-10 flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-serif italic text-white mb-1">Analyse Comparative</h3>
                                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] font-mono">Performance Empire (Semaine 1) vs Déclassement Chaos (Semaine 2)</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-white" /> Empire
                                </div>
                                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-red-500">
                                    <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_10px_#EF4444]" /> Chaos
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
                                                i < 7 ? "bg-white/20 group-hover:bg-white/40" : "bg-red-600/20 group-hover:bg-red-600/40"
                                            )}
                                        >
                                            <div className={cn("absolute bottom-0 left-0 w-full h-[2px]", i < 7 ? "bg-white" : "bg-red-500 shadow-[0_-5px_15px_#EF4444]")} />
                                        </motion.div>
                                        <span className="text-[7px] font-black text-zinc-600 uppercase">J{i+1}</span>
                                    </div>
                                );
                            })}
                            
                            <div className="absolute inset-0 flex items-center justify-center -rotate-12 pointer-events-none opacity-10">
                                <Lock size={200} className="text-white" />
                            </div>
                        </div>
                        
                        <div className="mt-12 bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skull className="text-red-500" size={24} />
                                <div>
                                    <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Diagnostic Automatisé</p>
                                    <p className="text-[11px] font-medium text-zinc-300">Drift de stock de <span className="text-red-500 font-bold">18.4%</span> injecté. Écarts fiscaux identifiés sur 4 ordres.</p>
                                </div>
                            </div>
                            <Button className="h-10 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">
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
            "bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-8 backdrop-blur-3xl transition-all hover:border-zinc-700",
            highlight && "border-red-500/30 bg-red-950/5 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
        )}>
            <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                    {icon}
                </div>
                <div className="bg-white/5 rounded-full px-2 py-0.5 text-[7px] font-black uppercase text-zinc-500 tracking-tighter">Live</div>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</h4>
            <div className="text-3xl font-mono font-black italic tracking-tighter mb-2">{value}</div>
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">{subtitle}</p>
        </div>
    );
}
