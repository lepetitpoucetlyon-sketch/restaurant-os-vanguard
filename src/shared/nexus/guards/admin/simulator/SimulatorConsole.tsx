"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { Play, Square, Activity, Users, DollarSign, AlertCircle, Terminal, TrendingUp, Cpu, ChevronRight, Settings, Calculator } from 'lucide-react';
import { simulator } from '@/modules/intelligence/simulator/TemporalSimulator';
import { simulationMetricsAtom, isSimulationRunningAtom } from '@/modules/intelligence/simulator/store/simulatorAtoms';
import { GlassCard } from '@ui/GlassCard';
import { Button } from '@ui/button';
import { SimulationProfile } from '@domain/services/SimulationService';
import { ProposalPanel } from '../ProposalPanel';
import { NexusStaffingOracle as StaffingOracle } from '@modules/human/services/NexusStaffingOracle';
import { SovereignLedger } from '@/infrastructure/adapters/SovereignLedgerAdapter';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { cn } from '@/lib/ui.foundations';
import { useTenant } from '@/shared/hooks';

export function SimulatorConsole() {
    const { activeTenantId } = useTenant();
    const [metrics, setMetrics] = useAtom(simulationMetricsAtom);
    const [isRunning, setIsRunning] = useAtom(isSimulationRunningAtom);
    const [speed, setSpeed] = useState(5);
    const [profile] = useState<SimulationProfile>('PIZZERIA_RUSH');
    const [logs, setLogs] = useState<{id: string, message: string, type: string, timestamp: string}[]>([]);
    const [history, setHistory] = useState<number[]>([]);
    const [staffRatio, setStaffRatio] = useState(25);
    const [accountingMode, setAccountingMode] = useState<string>('EXPERT');
    const [isOverridesOpen, setIsOverridesOpen] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState<'IDLE' | 'VERIFYING' | 'SECURE' | 'BREACH'>('IDLE');

    // Load Settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as import('@nexus/contracts').GlobalSettings;
                if (data?.planningConfig?.staffToCoversRatio) setStaffRatio(data.planningConfig.staffToCoversRatio);
                if (data?.accountingConfig?.complexityMode) setAccountingMode(data.accountingConfig.complexityMode);
            } catch (_e) {}
        };
        loadSettings();
    }, []);
    const updateStaffRatio = async (val: number) => {
        setStaffRatio(val);
        try {
            const data = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as import('@nexus/contracts').GlobalSettings;
            const newSettings = {
                ...data,
                planningConfig: { ...data?.planningConfig, staffToCoversRatio: val }
            };
            await Nexus.adapter.set(Nexus.getTenantPath('settings/global'), newSettings);
            addLog(`Oracle Ratio Adjusted: 1:${val}`, 'info');
            
            // Real-time Resonance: Trigger an immediate analysis if running
            if (isRunning) {
                await StaffingOracle.analyzeStaffingGaps(new Date().toISOString().split('T')[0]);
            }
        } catch (e) {
            console.error("Staff Ratio update failed", e);
        }
    };

    const toggleAccountingMode = async () => {
        const prevMode = accountingMode;
        const newMode = prevMode === 'SIMPLE' ? 'EXPERT' : 'SIMPLE';
        setAccountingMode(newMode);
        try {
            const data = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as import('@nexus/contracts').GlobalSettings;
            await Nexus.adapter.set(Nexus.getTenantPath('settings/global'), {
                ...data,
                accountingConfig: { ...data?.accountingConfig, complexityMode: newMode }
            });
            addLog(`Financial Complexity: ${newMode}`, 'info');

            if (newMode === 'EXPERT') {
                runInquisiteurQA();
            } else {
                setIntegrityStatus('IDLE');
            }
        } catch (_e) {
            setAccountingMode(prevMode);
            addLog('Financial Complexity toggle failed — reverted.', 'error');
        }
    };

    const runInquisiteurQA = async () => {
        setIntegrityStatus('VERIFYING');
        try {
            const audit = await SovereignLedger.getInstance(activeTenantId ?? 'unknown').runInquisiteurQA();
            setIntegrityStatus(audit.secure ? 'SECURE' : 'BREACH');
            if (!audit.secure) {
                addLog(`INQUISITEUR QA: Critical Balance Breach! Diff: ${(Math.abs(audit.expected - audit.actual)/100).toFixed(2)}€`, 'error');
            } else {
                addLog('INQUISITEUR QA: Ledger Integrity Certified (Grade X).', 'info');
            }
        } catch(_e) {
            setIntegrityStatus('BREACH');
            addLog('INQUISITEUR QA: System Failure during scan.', 'error');
        }
    };
    
    // ⚡ BATCHING JOTAI @ 500ms
    useEffect(() => {
        if (!isRunning) return;
        
        const interval = setInterval(() => {
            const currentMetrics = simulator.getMetrics();
            setMetrics({ ...currentMetrics });
            setHistory(prev => [...prev, currentMetrics.totalRevenueCents].slice(-20));
        }, 500);
        
        return () => clearInterval(interval);
    }, [isRunning, setMetrics]);

    const handleStart = async () => {
        await simulator.initialize();
        simulator.start(profile, speed);
        setIsRunning(true);
        addLog(`Protocol Grade X initiated: ${profile}`, 'info');
    };

    const handleStop = () => {
        simulator.stop();
        setIsRunning(false);
        addLog('Reality restored. Simulation data archived in Sandbox.', 'warn');
    };

    const addLog = (message: string, type: string) => {
        setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), message, type, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
            {/* Control Bar */}
            <GlassCard className="p-4 flex items-center justify-between border-subtle hover:border-accent/30 transition-colors duration-500 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-70">Temporal Speed</span>
                        <div className="flex items-center gap-2">
                            {[1, 5, 20, 100].map(s => (
                                <motion.button 
                                    key={s} 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSpeed(s)} 
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${speed === s ? 'bg-accent text-white shadow-[0_0_15px_rgba(255,46,99,0.4)]' : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'}`}
                                >
                                    {s}x
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 px-4 border-l border-subtle ml-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent opacity-70 flex items-center gap-2">
                            <Cpu size={10} />
                            Singularity Status
                        </span>
                        <span className="text-xs font-mono text-white/90">ACTIVE_RESONANCE</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsOverridesOpen(!isOverridesOpen)}
                        className={`gap-2 text-[10px] uppercase font-black tracking-widest transition-all ${isOverridesOpen ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-white'}`}
                    >
                        <Settings size={14} />
                        Overrides
                    </Button>

                    <AnimatePresence mode="wait">
                        {!isRunning ? (
                            <motion.div
                                key="start"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Button onClick={handleStart} className="bg-success hover:bg-success/90 text-white gap-2 px-8 shadow-xl shadow-success/20 group overflow-hidden relative">
                                    <motion.div className="absolute inset-0 bg-surface-card/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <Play size={16} className="relative z-10" /> 
                                    <span className="relative z-10">Initier l'Oracle</span>
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="stop"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Button onClick={handleStop} variant="destructive" className="gap-2 px-8 shadow-xl shadow-error/20 group">
                                    <Square size={16} className="group-hover:scale-110 transition-transform" /> 
                                    <span>Suspendre</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </GlassCard>

            {/* Metrics & Gauges */}
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

            {/* Sovereign Advisor Panel (Acte 6) */}
            <ProposalPanel />

            {/* Floating Singularity Overrides (Acte 6 & 7 Final) */}
            <AnimatePresence>
                {isOverridesOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="fixed top-24 right-8 z-50 w-72"
                    >
                        <GlassCard className="p-6 border-accent/30 bg-surface-sidebar/80 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1">
                                <Button variant="ghost" size="sm" onClick={() => setIsOverridesOpen(false)} className="h-6 w-6 p-0 text-text-muted hover:text-white">
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                            
                            <div className="flex flex-col gap-8 relative z-10">
                                <div className="flex items-center gap-3 border-b border-subtle pb-4">
                                    <Cpu size={18} className="text-accent animate-pulse" />
                                    <span className="text-sm font-black uppercase tracking-widest text-white">Singularity Overrides</span>
                                </div>

                                {/* Ratio Tuning */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Staffing Ratio</span>
                                        <span className="text-xs font-mono font-bold text-accent">1 : {staffRatio}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="15" 
                                        max="35" 
                                        step="1"
                                        value={staffRatio}
                                        onChange={(e) => updateStaffRatio(parseInt(e.target.value))}
                                        className="w-full accent-accent bg-surface-card/10 rounded-lg appearance-none h-1.5"
                                    />
                                    <div className="flex justify-between text-[8px] font-mono text-text-muted uppercase">
                                        <span>Palace</span>
                                        <span>Optimal</span>
                                        <span>Fast-Casual</span>
                                    </div>
                                </div>

                                {/* Finance Toggle */}
                                <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Financial Complexity</span>
                                    <div className="grid grid-cols-2 gap-2 bg-surface-sidebar/40 p-1 rounded-xl border border-subtle">
                                        {['SIMPLE', 'EXPERT'].map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => toggleAccountingMode()}
                                                className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    accountingMode === mode 
                                                    ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                                                    : 'text-text-muted hover:text-white'
                                                }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                    {accountingMode === 'EXPERT' && (
                                        <div className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded border transition-all duration-500",
                                            integrityStatus === 'SECURE' ? "bg-success/10 border-success/30" : 
                                            integrityStatus === 'BREACH' ? "bg-error/20 border-error/50 animate-pulse" :
                                            "bg-surface-card/5 border-subtle"
                                        )}>
                                            <Calculator size={10} className={cn(
                                                integrityStatus === 'SECURE' ? "text-success" : 
                                                integrityStatus === 'BREACH' ? "text-error" : "text-white/50"
                                            )} />
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest",
                                                integrityStatus === 'SECURE' ? "text-success" : 
                                                integrityStatus === 'BREACH' ? "text-error" : "text-white/50"
                                            )}>
                                                {integrityStatus === 'VERIFYING' ? 'Reconing...' : 
                                                 integrityStatus === 'SECURE' ? 'Inquisiteur QA: SECURE' : 
                                                 integrityStatus === 'BREACH' ? 'INTEGRITY BREACH' : 'Inquisiteur QA: IDLE'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 rounded-lg bg-surface-card/5 border border-subtle">
                                    <p className="text-[9px] leading-relaxed text-text-muted italic">
                                        "Les réglages appliqués ici modifient la résonance de l'Oracle en temps réel."
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Binary Terminal (Gastro-Code Architecture) */}
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
                                    <span className="text-white/90">
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
        </div>
    );
}
