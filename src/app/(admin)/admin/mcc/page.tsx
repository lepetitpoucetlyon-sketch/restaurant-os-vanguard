'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Rocket, LayoutGrid,
    Lock, RefreshCw, GitMerge, BrainCircuit, Wallet,
} from 'lucide-react';
import dynamic from 'next/dynamic';

import { MCCWidgetSkeleton, MFAGate } from '@nexus/guards/admin/mcc';
import { useMccPage, PROV_STEPS } from './_hooks/useMccPage';
import { useSovereignSwitchboard } from '@/shared/hooks/useSovereignSwitchboard';
import { VoiceAssistantOverlay } from '@/components/layout/VoiceAssistantOverlay';
import { AmbientAudio } from '@/components/layout/AmbientAudio';

const FleetTab        = dynamic(() => import('./_tabs/FleetTab').then(m => m.FleetTab), { loading: () => <MCCWidgetSkeleton /> });
const FleetSidebar    = dynamic(() => import('./_tabs/FleetSidebar').then(m => m.FleetSidebar));
const ComplianceTab   = dynamic(() => import('./_tabs/ComplianceTab').then(m => m.ComplianceTab), { loading: () => <MCCWidgetSkeleton /> });
const IntelligenceTab = dynamic(() => import('./_tabs/IntelligenceTab').then(m => m.IntelligenceTab), { loading: () => <MCCWidgetSkeleton /> });
const TreasuryTab     = dynamic(() => import('./_tabs/TreasuryTab').then(m => m.TreasuryTab), { loading: () => <MCCWidgetSkeleton /> });
const PatchCenterTab  = dynamic(() => import('./_tabs/PatchCenterTab').then(m => m.PatchCenterTab), { loading: () => <MCCWidgetSkeleton /> });

export default function MCCDashboard() {
    const {
        instances, globalMetrics, isLoading, refreshFleet,
        health, userInitials,
        showCloneModal, setShowCloneModal,
        activeTab, setActiveTab,
        newCloneName, setNewCloneName,
        newCloneKey, setNewCloneKey,
        newCloneEmail, setNewCloneEmail,
        newCloneTier, setNewCloneTier,
        provisioningStatus, provisionStep,
        handleCreateClone,
    } = useMccPage();

    const { state: switchboard, toggleModule } = useSovereignSwitchboard();

    return (
        <MFAGate>
            <div className="min-h-screen bg-surface-bg text-text-primary font-sans selection:bg-action-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-action-primary/8 blur-[140px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-action-primary/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative z-10 p-8">
                    <VoiceAssistantOverlay />

                    <header className="flex flex-wrap gap-4 justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-tr from-action-primary to-action-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Rocket className="text-text-primary w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight uppercase">Master Console</h1>
                                <p className="text-secondary text-sm font-medium">Empire Orchestrator • v4.0.0-NEXUS</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <AmbientAudio />
                            <button onClick={() => refreshFleet()} disabled={isLoading} className={`flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all active:scale-95 ${isLoading ? 'opacity-50' : ''}`}>
                                <RefreshCw className={`w-4 h-4 text-brand ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-muted">Global Sync</span>
                            </button>
                            <div className="hidden sm:flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-2.5 rounded-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Axiom Bridge</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-action-primary/20 border border-focus/30 flex items-center justify-center font-bold text-brand">{userInitials}</div>
                        </div>
                    </header>

                    <div className="overflow-x-auto scrollbar-none -mx-8 px-8 mb-10">
                        <div className="flex gap-6 border-b border-white/5 min-w-max">
                            {([
                                { id: 'fleet',        label: 'Fleet',      icon: <LayoutGrid className="w-4 h-4" /> },
                                { id: 'compliance',   label: 'Compliance', icon: <ShieldCheck className="w-4 h-4" /> },
                                { id: 'intelligence', label: 'Oracle',     icon: <BrainCircuit className="w-4 h-4" /> },
                                { id: 'treasury',     label: 'Treasury',   icon: <Wallet className="w-4 h-4" /> },
                                { id: 'patchcenter',  label: 'Patches',    icon: <GitMerge className="w-4 h-4" /> },
                            ] as const).map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-action-primary text-brand' : 'border-transparent text-secondary hover:text-text-primary'}`}>
                                    {tab.icon}{tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-8 space-y-8">
                            <AnimatePresence mode="wait">
                                {activeTab === 'fleet' && (
                                    <motion.div key="fleet" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <FleetTab instances={instances} globalMetrics={globalMetrics} onShowCloneModal={() => setShowCloneModal(true)} />
                                    </motion.div>
                                )}
                                {activeTab === 'compliance' && (
                                    <motion.div key="compliance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <ComplianceTab />
                                    </motion.div>
                                )}
                                {activeTab === 'intelligence' && (
                                    <motion.div key="intelligence" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <IntelligenceTab />
                                    </motion.div>
                                )}
                                {activeTab === 'treasury' && (
                                    <motion.div key="treasury" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <TreasuryTab />
                                    </motion.div>
                                )}
                                {activeTab === 'patchcenter' && (
                                    <motion.div key="patchcenter" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <PatchCenterTab />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {activeTab === 'fleet' && (
                            <div className="col-span-12 lg:col-span-4 space-y-8">
                                <FleetSidebar health={health} switchboard={switchboard} onToggleModule={toggleModule} />
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {showCloneModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !provisioningStatus && setShowCloneModal(false)} className="absolute inset-0 bg-surface-sidebar/80 backdrop-blur-sm" />
                                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-surface-bg/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-action-primary/20 rounded-2xl flex items-center justify-center">
                                            <Rocket className="text-brand w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold uppercase tracking-tight">Birth of a New Clone</h2>
                                            <p className="text-secondary text-sm">DNA Injection & Infrastructure</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Instance Name</label>
                                            <input type="text" placeholder="ex: Le Grand Paris" className="w-full bg-surface-bg border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all font-medium" value={newCloneName} onChange={(e) => { setNewCloneName(e.target.value); setNewCloneKey(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Subdomain Slug</label>
                                            <input type="text" placeholder="ex: le-grand-paris" className="w-full bg-surface-bg border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all font-mono" value={newCloneKey} onChange={(e) => setNewCloneKey(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Owner Email</label>
                                            <input type="email" placeholder="owner@restaurant.fr" className="w-full bg-surface-bg border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all" value={newCloneEmail} onChange={(e) => setNewCloneEmail(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Tier</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['STANDARD', 'PREMIUM', 'ENTERPRISE'] as const).map((t) => (
                                                    <button key={t} type="button" onClick={() => setNewCloneTier(t)} className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${newCloneTier === t ? 'bg-action-primary/20 border-focus/50 text-brand' : 'bg-surface-bg border-subtle text-secondary hover:border-white/20'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-action-primary/5 border border-focus/10 rounded-2xl flex items-center gap-3">
                                            <Lock className="w-5 h-5 text-brand shrink-0" />
                                            <p className="text-[10px] text-muted leading-relaxed uppercase tracking-tighter">Policy: Toutes les instances sont provisionnées avec NF525 et 2FA activés par défaut (STANDARD_DNA_V3).</p>
                                        </div>
                                        {provisioningStatus ? (
                                            <div className="flex flex-col py-4 gap-3">
                                                {PROV_STEPS.map((step, i) => (
                                                    <div key={step} className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${i < provisionStep ? 'bg-status-success border-emerald-500' : i === provisionStep ? 'border-brand animate-pulse bg-action-primary/20' : 'border-white/10'}`}>
                                                            {i < provisionStep && <span className="text-[8px] text-text-primary">✓</span>}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${i === provisionStep ? 'text-brand' : i < provisionStep ? 'text-status-success/60' : 'text-text-primary/20'}`}>{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex gap-4 pt-4">
                                                <button onClick={() => setShowCloneModal(false)} className="flex-1 py-4 font-bold text-secondary hover:text-text-primary transition-all text-xs uppercase tracking-[0.2em]">Cancel</button>
                                                <button onClick={handleCreateClone} className="flex-1 bg-surface-card text-primary font-black py-4 rounded-2xl hover:bg-surface-bg transition-all active:scale-95 text-xs uppercase tracking-[0.2em]">Launch Birth</button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MFAGate>
    );
}
