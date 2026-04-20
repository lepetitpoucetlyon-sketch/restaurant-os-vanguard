// @ts-nocheck
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard, StatsGrid } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { SimulationService, MonteCarloResult, SimulationProfile, SimulationMode } from "@/domain/services/SimulationService";
import { SimulatorConsole } from "@/components/admin/simulator/SimulatorConsole";
import { TrendingUp, Users, AlertTriangle, Play, RefreshCcw, DollarSign, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🌀 Nexus Temporal Simulator (Grade X)
 * UI de contrôle pour le forking de réalité et les prédictions Monte-Carlo.
 */
export default function SimulatorPage() {
    const [days, setDays] = useState(7);
    const [iterations, setIterations] = useState(5);
    const [profile, setProfile] = useState<SimulationProfile>("PIZZERIA_RUSH");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<MonteCarloResult[] | null>(null);

    const runSimulation = async () => {
        setLoading(true);
        try {
            const results = await SimulationService.runMonteCarlo(days, iterations, profile, 'EMPIRE');
            setResults(results);
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    };

    return (
        <div className="flex flex-col gap-10 p-8 max-w-[1400px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="Nexus Temporal Simulator" 
                subtitle="Grade X Shadow Context Forking & Live Monitoring"
                emoji="🌀"
            />

            <section className="flex flex-col gap-4">
                <SectionTitle title="Live Temporal Monitor" />
                <SimulatorConsole />
            </section>

            <section className="flex flex-col gap-6 pt-10 border-t border-border/50">
                <SectionTitle title="Predictive Monte-Carlo Forge" />
                <GlassCard className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Horizon Temporel (Jours)</label>
                        <input 
                            type="number" 
                            value={days} 
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="bg-bg-primary border border-border rounded-xl p-3 focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Itérations (Timelines)</label>
                        <input 
                            type="number" 
                            value={iterations} 
                            onChange={(e) => setIterations(Number(e.target.value))}
                            className="bg-bg-primary border border-border rounded-xl p-3 focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Profil de Charge</label>
                        <select 
                            value={profile} 
                            onChange={(e) => setProfile(e.target.value as SimulationProfile)}
                            className="bg-bg-primary border border-border rounded-xl p-3 focus:outline-none focus:border-accent"
                        >
                            <option value="PIZZERIA_RUSH">Pizzeria Rush (Vol. Élevé)</option>
                            <option value="FINE_DINING_CALM">Fine Dining (Haute Marge)</option>
                            <option value="SUMMER_PEAK">Summer Peak (Chaos-ready)</option>
                            <option value="DEFAULT">Standard Business</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button 
                            onClick={runSimulation} 
                            disabled={loading}
                            className="w-full h-[52px] gap-2"
                        >
                            {loading ? <RefreshCcw className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />}
                            Lancer la Simulation
                        </Button>
                    </div>
                </div>
            </GlassCard>
            </section>

            <AnimatePresence>
                {results && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-8"
                    >
                        <SectionTitle title="Moyenne des Mondes Parallèles" />
                        <StatsGrid columns={4}>
                            <StatCard 
                                label="Chiffre d'Affaire Estimé" 
                                value={formatCurrency(results.reduce((acc, r) => acc + r.metrics.totalRevenue, 0) / results.length)} 
                                icon={DollarSign}
                                accentColor="success"
                            />
                            <StatCard 
                                label="Profit Net Prédit" 
                                value={formatCurrency(results.reduce((acc, r) => acc + r.metrics.netProfit, 0) / results.length)} 
                                icon={TrendingUp}
                                accentColor="accent"
                            />
                            <StatCard 
                                label="Index de Burnout Staff" 
                                value={`${(results.reduce((acc, r) => acc + r.metrics.burnoutIndex, 0) / results.length).toFixed(1)}%`} 
                                icon={Users}
                                accentColor={results.reduce((acc, r) => acc + r.metrics.burnoutIndex, 0) / results.length > 70 ? "error" : "info"}
                            />
                            <StatCard 
                                label="Anomalies Potentielles" 
                                value={(results.reduce((acc, r) => acc + r.metrics.anomalyCount, 0) / results.length).toFixed(1)} 
                                icon={AlertTriangle}
                                accentColor="warning"
                            />
                        </StatsGrid>

                        <SectionTitle title="Visualisation des Timelines" />
                        <GlassCard className="p-8 h-[300px] flex items-end gap-1">
                            {results.map((r, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    <div 
                                        className="w-full bg-accent/20 border-t-2 border-accent rounded-t-lg transition-all hover:bg-accent/40"
                                        style={{ height: `${Math.max(10, (r.metrics.netProfit / results[0].metrics.totalRevenue) * 500)}%` }}
                                    >
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-bg-secondary border border-border p-2 rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                            {r.timelineId}<br/>
                                            Profit: {formatCurrency(r.metrics.netProfit)}
                                        </div>
                                    </div>
                                    <span className="text-[8px] text-text-muted font-mono">T-{i+1}</span>
                                </div>
                            ))}
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SectionTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-4">
            <h2 className="font-serif italic text-2xl text-text-primary capitalize">{title}</h2>
            <div className="h-px bg-border flex-1" />
        </div>
    );
}
