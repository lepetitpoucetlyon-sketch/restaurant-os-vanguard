 
 
"use client";

import { useState } from "react";
import {
    Cpu,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Play,
    Zap,
    BarChart3
} from "lucide-react";
import { useNexusFleet } from '@/modules/intelligence';
import { Button } from "@ui/button";
import { cn } from "@/lib/ui.foundations";
import { motion } from "framer-motion";
import { useNotifications } from "@/shared/hooks";
import { Modal } from "@ui/Modal";

export default function SimulatorPage() {

    const { addNotification } = useNotifications();

    const [isSimulating, setIsSimulating] = useState(false);
    const [showNewSimModal, setShowNewSimModal] = useState(false);

    const [newSimConfig, setNewSimConfig] = useState({
        name: "",
        priceChange: 0,
        laborChange: 0,
        marketingSpend: 0
    });
    
    const fleet = useNexusFleet();
    if (!fleet) return null;
    
    interface Scenario {
        id: string;
        name: string;
        description: string;
        confidenceScore: number;
        projections: {
            revenueImpact: number;
            laborCostImpact: number;
            netProfitChange: number;
        };
    }
    const { scenarios, runSimulation, financialInsight, globalInflationRate, setGlobalInflationRate } = fleet as unknown as {
        scenarios: Scenario[];
        runSimulation: (config: { name: string; description: string; inputs: Record<string, number> }) => Promise<void>;
        financialInsight: { revenue?: number; foodCostPercent?: number; laborCostPercent?: number; primeCost?: number };
        globalInflationRate: number;
        setGlobalInflationRate: (rate: number) => void;
    };

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        try {
            await runSimulation?.({
                name: newSimConfig.name,
                description: `Simulation manuelle: Prix ${newSimConfig.priceChange > 0 ? '+' : ''}${newSimConfig.priceChange}%, Main d'œuvre ${newSimConfig.laborChange}%`,
                inputs: {
                    priceChange: newSimConfig.priceChange / 100
                }
            });
            setShowNewSimModal(false);
            addNotification({
                title: "Simulation Terminée",
                message: "Les résultats de votre scénario sont disponibles.",
                type: "success"
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSimulating(false);
            setNewSimConfig({ name: "", priceChange: 0, laborChange: 0, marketingSpend: 0 });
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex-col bg-bg-primary overflow-hidden pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-bg-secondary px-10 pt-10 pb-6 flex justify-between items-end border-b border-border shadow-sm">
                <div>
                    <h1 className="text-4xl font-serif font-black italic text-text-primary tracking-tighter">Business Simulator<span className="text-accent-gold not-italic">.</span></h1>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mt-2 italic">Digital Twin • Scénarios • Prédictions</p>
                </div>

                <Button
                    onClick={() => setShowNewSimModal(true)}
                    className="h-12 bg-accent-gold text-text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] px-8 shadow-premium hover:bg-accent-gold/90 transition-all"
                >
                    <Play className="w-3.5 h-3.5 mr-2" />
                    Nouveau Scénario
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    {/* Left: Current Reality (Baseline) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-8 rounded-[2rem] bg-bg-tertiary/20 border border-border">
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <BarChart3 className="w-3 h-3" />
                                Performance Actuelle (Baseline)
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-serif italic text-text-secondary">Chiffre d'Affaires (Réel)</p>
                                    <div className="text-4xl font-serif font-black text-text-primary mt-1">{financialInsight?.revenue?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0,00 €'}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-surface-card dark:bg-bg-secondary rounded-2xl border border-border">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Food Cost</p>
                                        <div className={cn("text-2xl font-bold mt-2", (financialInsight?.foodCostPercent || 0) > 30 ? "text-error" : "text-success")}>
                                            {Math.round(financialInsight?.foodCostPercent || 0)}%
                                        </div>
                                    </div>
                                    <div className="p-4 bg-surface-card dark:bg-bg-secondary rounded-2xl border border-border">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Labor Cost</p>
                                        <div className={cn("text-2xl font-bold mt-2", (financialInsight?.laborCostPercent || 0) > 35 ? "text-error" : "text-success")}>
                                            {Math.round(financialInsight?.laborCostPercent || 0)}%
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-accent-gold/10 rounded-2xl border border-accent-gold/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-black text-accent-gold uppercase tracking-wider">Prime Cost</p>
                                        <Zap className="w-4 h-4 text-accent-gold" fill="currentColor" />
                                    </div>
                                    <div className="text-3xl font-black text-accent-gold">{Math.round(financialInsight?.primeCost || 0)}%</div>
                                    <p className="text-[9px] text-text-muted mt-2">Objectif: &lt; 60%</p>
                                </div>

                                {/* Master Inflation Controller */}
                                <div className="p-6 bg-surface-sidebar/5 dark:bg-surface-card/5 rounded-[2rem] border border-border backdrop-blur-xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Master Inflation Simulation</h4>
                                        <div className="px-3 py-1 bg-accent-gold/20 rounded-full text-[10px] font-black text-accent-gold italic">
                                            {globalInflationRate}%
                                        </div>
                                    </div>
                                    
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="20" 
                                        step="1"
                                        value={(globalInflationRate as number) || 0}
                                        onChange={(e) => setGlobalInflationRate?.(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-surface-bg dark:bg-surface-card/10 rounded-lg appearance-none cursor-pointer accent-accent-gold"
                                    />
                                    
                                    <div className="flex justify-between mt-3 text-[8px] font-black text-text-muted tracking-widest uppercase">
                                        <span>Stable</span>
                                        <span>Crisis (20%)</span>
                                    </div>

                                    <p className="text-[9px] text-text-muted mt-6 italic opacity-70">
                                        Impact global sur les marges POS et scores de signature Customer.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-surface-sidebar to-surface-sidebar text-text-primary relative overflow-hidden">
                            <Cpu className="w-32 h-32 absolute -right-6 -bottom-6 text-text-primary/5 rotate-12" />
                            <h3 className="text-xl font-serif font-bold italic z-10 relative">I.A. Insights</h3>
                            <p className="text-sm text-text-primary/70 mt-2 z-10 relative leading-relaxed">
                                "Augmenter vos prix de 5% sur la gamme 'Vins' pourrait générer +1,2k€ de marge nette sans impacter la demande, selon les tendances actuelles."
                            </p>
                            <Button variant="outline" className="mt-6 border-default text-text-primary hover:bg-surface-card/10 z-10 relative h-10 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                Appliquer ce scénario
                            </Button>
                        </div>
                    </div>

                    {/* Right: Scenarios List & Details */}
                    <div className="lg:col-span-2 flex flex-col h-full bg-surface-card dark:bg-bg-secondary rounded-[2.5rem] border border-border shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-border bg-bg-tertiary/10">
                            <h2 className="text-2xl font-serif font-light text-text-primary italic">Bibliothèque de <span className="font-black">Scénarios</span></h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {(scenarios ?? []).length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Cpu className="w-20 h-20 mb-4" strokeWidth={1} />
                                    <p className="font-serif italic text-xl">Aucune simulation active</p>
                                    <p className="text-sm">Lancez votre première simulation pour voir l'avenir.</p>
                                </div>
                            ) : (
                                (scenarios ?? []).map((scenario: Scenario) => (
                                    <motion.div
                                        key={scenario.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 rounded-3xl border border-border bg-bg-primary hover:border-accent-gold transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="font-bold text-lg text-text-primary">{scenario.name}</h3>
                                                <p className="text-sm text-text-muted mt-1">{scenario.description}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-bg-tertiary rounded-full text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                                Confiance {(scenario.confidenceScore * 100).toFixed(0)}%
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-4 rounded-2xl bg-success/5 border border-success/10">
                                                <p className="text-[9px] text-success/80 font-black uppercase tracking-wider mb-2">Impact Revenu</p>
                                                <div className="text-2xl font-black text-success flex items-center gap-2">
                                                    {scenario.projections.revenueImpact > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                    {Math.abs(scenario.projections.revenueImpact).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-2xl bg-bg-tertiary border border-border">
                                                <p className="text-[9px] text-text-muted font-black uppercase tracking-wider mb-2">Impact Coûts</p>
                                                <div className="text-xl font-bold text-text-primary">
                                                    {scenario.projections.laborCostImpact > 0 ? '+' : ''}{scenario.projections.laborCostImpact.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "p-4 rounded-2xl border",
                                                scenario.projections.netProfitChange > 0 ? "bg-accent-gold text-text-primary border-accent-gold" : "bg-error text-text-primary border-error"
                                            )}>
                                                <p className="text-[9px] opacity-80 font-black uppercase tracking-wider mb-2">Profit Net Est.</p>
                                                <div className="text-2xl font-black">
                                                    {scenario.projections.netProfitChange > 0 ? '+' : ''}{scenario.projections.netProfitChange.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="h-9 text-xs">Détails Complets</Button>
                                            <Button variant="outline" className="h-9 text-xs border-dashed">Archiver</Button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Simulation Modal */}
            <Modal
                isOpen={showNewSimModal}
                onClose={() => setShowNewSimModal(false)}
                title="Lancer une Simulation"
            >
                <div className="space-y-8 p-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-4">Nom du Scénario</label>
                        <input
                            type="text"
                            value={newSimConfig.name}
                            onChange={e => setNewSimConfig({ ...newSimConfig, name: e.target.value })}
                            placeholder="ex: Hausse Prix Été 2026"
                            className="w-full h-14 px-6 bg-surface-bg dark:bg-surface-card/5 border-2 border-transparent focus:border-accent-gold rounded-xl text-lg text-text-primary focus:outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-4">Ajustement Prix (%)</label>
                            <div className="flex items-center gap-4">
                                <DollarSign className="w-5 h-5 text-text-muted" />
                                <input
                                    type="number"
                                    value={newSimConfig.priceChange}
                                    onChange={e => setNewSimConfig({ ...newSimConfig, priceChange: parseFloat(e.target.value) })}
                                    className="w-full h-14 px-6 bg-surface-bg dark:bg-surface-card/5 rounded-xl font-mono text-xl"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-4">Coût Staff (%)</label>
                            <div className="flex items-center gap-4">
                                <Users className="w-5 h-5 text-text-muted" />
                                <input
                                    type="number"
                                    value={newSimConfig.laborChange}
                                    onChange={e => setNewSimConfig({ ...newSimConfig, laborChange: parseFloat(e.target.value) })}
                                    className="w-full h-14 px-6 bg-surface-bg dark:bg-surface-card/5 rounded-xl font-mono text-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleRunSimulation}
                        disabled={isSimulating || !newSimConfig.name}
                        className="w-full h-16 bg-accent-gold text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-accent-gold/20 flex items-center justify-center gap-3"
                    >
                        {isSimulating ? (
                            <>
                                <Cpu className="w-5 h-5 animate-spin" />
                                Calcul en cours...
                            </>
                        ) : (
                            <>
                                <Cpu className="w-5 h-5" />
                                Exécuter la Simulation I.A.
                            </>
                        )}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
