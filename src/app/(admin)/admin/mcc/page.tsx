'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Rocket, LayoutGrid, Activity, Plus, Lock,
    TrendingUp, RefreshCw, Zap, Cpu, Wallet, BrainCircuit, GitMerge,
} from 'lucide-react';
import dynamic from 'next/dynamic';

import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc/MCCWidgetSkeleton';
import { useMccPage, PROV_STEPS } from './_hooks/useMccPage';
import { StatCard, DeviceManagerPanel, TabButton, StatusItem, SwitchboardItem } from './_components';
import { VoiceAssistantOverlay } from '@/components/layout/VoiceAssistantOverlay';
import { MFAGate } from '@/components/mcc/MFAGate';
import { AmbientAudio } from '@/components/layout/AmbientAudio';
import { useSovereignSwitchboard } from '@/hooks/useSovereignSwitchboard';
import { TenantUsersPanel } from '@nexus/guards/admin/mcc/TenantUsersPanel';

const MCCAuditStream    = dynamic(() => import('@nexus/guards/admin/mcc/MCCAuditStream').then(m => m.MCCAuditStream), { loading: () => <MCCWidgetSkeleton /> });
const MCCInsights       = dynamic(() => import('@nexus/guards/admin/mcc/MCCInsights').then(m => m.MCCInsights), { loading: () => <MCCWidgetSkeleton /> });
const CertificationCenter = dynamic(() => import('@nexus/guards/admin/mcc/CertificationCenter').then(m => m.CertificationCenter), { loading: () => <MCCWidgetSkeleton /> });
const FiscalChainExplorer = dynamic(() => import('@nexus/guards/admin/mcc/FiscalChainExplorer').then(m => m.FiscalChainExplorer), { loading: () => <MCCWidgetSkeleton /> });
const DeploymentEngine  = dynamic(() => import('@nexus/guards/admin/mcc/DeploymentEngine').then(m => m.DeploymentEngine), { loading: () => <MCCWidgetSkeleton /> });
const MCCTreasury       = dynamic(() => import('@nexus/guards/admin/mcc/MCCTreasury').then(m => m.MCCTreasury), { loading: () => <MCCWidgetSkeleton /> });
const StrategyOracle    = dynamic(() => import('@nexus/guards/admin/mcc/StrategyOracle').then(m => m.StrategyOracle), { loading: () => <MCCWidgetSkeleton /> });
const FleetCommandTable = dynamic(() => import('@nexus/guards/admin/mcc/FleetCommandTable').then(m => m.FleetCommandTable), { loading: () => <MCCWidgetSkeleton /> });
const PerformanceMonitor = dynamic(() => import('@nexus/guards/admin/mcc/PerformanceMonitor').then(m => m.PerformanceMonitor), { loading: () => <MCCWidgetSkeleton /> });
const AIWorkshop        = dynamic(() => import('@nexus/guards/admin/mcc/AIWorkshop').then(m => m.AIWorkshop), { loading: () => <MCCWidgetSkeleton /> });
const TaxAuditPanel     = dynamic(() => import('@nexus/guards/admin/mcc/TaxAuditPanel').then(m => m.TaxAuditPanel), { loading: () => <MCCWidgetSkeleton /> });
const TrustedDevicePanel = dynamic(() => import('@nexus/guards/admin/mcc/TrustedDevicePanel').then(m => m.TrustedDevicePanel), { loading: () => <MCCWidgetSkeleton /> });
const TenantOverridePanel = dynamic(() => import('@nexus/guards/admin/mcc/TenantOverridePanel').then(m => m.TenantOverridePanel), { loading: () => <MCCWidgetSkeleton /> });
const TenantChangelogPanel = dynamic(() => import('@nexus/guards/admin/mcc/TenantChangelogPanel').then(m => m.TenantChangelogPanel), { loading: () => <MCCWidgetSkeleton /> });
const FleetUpgradePanel = dynamic(() => import('@nexus/guards/admin/mcc/FleetUpgradePanel').then(m => m.FleetUpgradePanel), { loading: () => <MCCWidgetSkeleton /> });

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
            <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-action-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-action-primary/8 blur-[140px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-action-primary/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative z-10 p-8">
                    <VoiceAssistantOverlay />

                    <header className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-tr from-action-primary to-action-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Rocket className="text-white w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight uppercase">Master Console</h1>
                                <p className="text-secondary text-sm font-medium">Empire Orchestrator • v4.0.0-NEXUS</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <AmbientAudio />
                            <button onClick={() => refreshFleet()} disabled={isLoading} className={`flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all active:scale-95 ${isLoading ? 'opacity-50' : ''}`}>
                                <RefreshCw className={`w-4 h-4 text-brand ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted">Global Sync</span>
                            </button>
                            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Axiom Bridge Connected</span>
                            </div>
                            <div className="w-px h-10 bg-surface-card/5 mx-2" />
                            <div className="w-10 h-10 rounded-full bg-action-primary/20 border border-focus/30 flex items-center justify-center font-bold text-brand">{userInitials}</div>
                        </div>
                    </header>

                    <div className="flex gap-8 border-b border-white/5 mb-10">
                        <TabButton active={activeTab === 'fleet'}        onClick={() => setActiveTab('fleet')}        label="Fleet Management"         icon={<LayoutGrid className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'compliance'}   onClick={() => setActiveTab('compliance')}   label="Compliance & Certification" icon={<ShieldCheck className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} label="Empire Oracle"              icon={<BrainCircuit className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'treasury'}     onClick={() => setActiveTab('treasury')}     label="Treasury & Logistics"       icon={<Wallet className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'patchcenter'}  onClick={() => setActiveTab('patchcenter')}  label="Patch Center"               icon={<GitMerge className="w-4 h-4" />} />
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-8 space-y-8">
                            <AnimatePresence mode="wait">
                                {activeTab === 'fleet' && (
                                    <motion.div key="fleet" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                            <StatCard label="Total Instances"    value={instances.length.toString()} icon={<LayoutGrid className="text-brand" />} trend="Fleet capacity at 100%" />
                                            <StatCard label="Global Revenue"     value={`€${((globalMetrics?.fleetTotalRevenue || 0) / 100).toLocaleString()}`} icon={<TrendingUp className="text-status-success" />} trend="Calculated in real-time" />
                                            <StatCard label="Fleet Health"       value={`${Math.round(globalMetrics?.averageHealthScore || 100)}%`} icon={<Activity className="text-brand" />} trend="Weighted average" />
                                            <StatCard label="Global Compliance"  value={`${globalMetrics?.averageComplianceScore?.toFixed(1) || '100'}%`} icon={<ShieldCheck className="text-brand" />} trend="NF525 Integrity Level" />
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-secondary">Fleet Tactical Overview</h3>
                                            <button onClick={() => setShowCloneModal(true)} className="bg-action-primary text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest text-[10px]">
                                                <Plus className="w-4 h-4" /> New Clone
                                            </button>
                                        </div>
                                        <FleetCommandTable />
                                        {instances.length > 0 && <TenantUsersPanel instance={instances[0]} />}
                                    </motion.div>
                                )}

                                {activeTab === 'compliance' && (
                                    <motion.div key="compliance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                                        <div className="grid grid-cols-12 gap-8">
                                            <div className="col-span-12 xl:col-span-8"><CertificationCenter /></div>
                                            <div className="col-span-12 xl:col-span-4"><FiscalChainExplorer /></div>
                                        </div>
                                        <TaxAuditPanel />
                                        <TrustedDevicePanel />
                                    </motion.div>
                                )}

                                {activeTab === 'intelligence' && (
                                    <motion.div key="intelligence" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                                        <StrategyOracle />
                                        <AIWorkshop />
                                        <DeviceManagerPanel />
                                    </motion.div>
                                )}

                                {activeTab === 'treasury' && (
                                    <motion.div key="treasury" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <MCCTreasury />
                                    </motion.div>
                                )}

                                {activeTab === 'patchcenter' && (
                                    <motion.div key="patchcenter" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                                        <div className="grid grid-cols-12 gap-8">
                                            <div className="col-span-12 xl:col-span-5 space-y-6">
                                                <TenantOverridePanel />
                                                <FleetUpgradePanel />
                                            </div>
                                            <div className="col-span-12 xl:col-span-7"><TenantChangelogPanel /></div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {activeTab === 'fleet' && (
                            <div className="col-span-12 lg:col-span-4 space-y-8">
                                <PerformanceMonitor />
                                <DeploymentEngine />
                                <MCCInsights />
                                <MCCAuditStream />
                                <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl mb-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Cpu className="w-5 h-5 text-brand mt-0.5" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">MCC Core Status</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <StatusItem label="Provisioning Engine" status={health ? (health.provisioningEngine === 'ready' ? 'Ready' : health.provisioningEngine === 'degraded' ? 'Dégradé' : 'Offline') : '…'} color={health ? (health.provisioningEngine === 'ready' ? 'bg-status-success' : health.provisioningEngine === 'degraded' ? 'bg-yellow-500' : 'bg-status-error') : 'bg-secondary'} />
                                        <StatusItem label="Axiom Log Ingest"    status={health ? (health.axiomLogIngest === 'streaming' ? 'Streaming' : health.axiomLogIngest === 'degraded' ? 'Dégradé' : 'Offline') : '…'} color={health ? (health.axiomLogIngest === 'streaming' ? 'bg-status-success' : health.axiomLogIngest === 'degraded' ? 'bg-yellow-500' : 'bg-status-error') : 'bg-secondary'} />
                                        <StatusItem label="NF525 Seal Engine"   status={health ? (health.nf525SealEngine === 'secured' ? 'Secured' : health.nf525SealEngine === 'degraded' ? 'Dégradé' : 'Offline ⚠') : '…'} color={health ? (health.nf525SealEngine === 'secured' ? 'bg-action-primary' : health.nf525SealEngine === 'degraded' ? 'bg-yellow-500' : 'bg-status-error') : 'bg-secondary'} />
                                        <StatusItem label="Fleet Intelligence"  status={health ? (health.fleetIntelligence === 'aggregating' ? 'Aggregating' : health.fleetIntelligence === 'degraded' ? 'Dégradé' : 'Offline') : '…'} color={health ? (health.fleetIntelligence === 'aggregating' ? 'bg-action-primary' : health.fleetIntelligence === 'degraded' ? 'bg-yellow-500' : 'bg-status-error') : 'bg-secondary'} />
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 backdrop-blur-md border border-focus/20 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Zap className="w-5 h-5 text-brand mt-0.5" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-brand">Sovereign Switchboard</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <SwitchboardItem label="Telemetry & Sentinel" active={switchboard.telemetryActive}      onToggle={() => toggleModule('telemetryActive', 'Manual MCC override')} />
                                        <SwitchboardItem label="SAM Automations"      active={switchboard.samActive}            onToggle={() => toggleModule('samActive', 'Manual MCC override')} />
                                        <SwitchboardItem label="Nexus Sync Engine"    active={switchboard.nexusSyncActive}      onToggle={() => toggleModule('nexusSyncActive', 'Manual MCC override')} />
                                        <SwitchboardItem label="Client Interface"     active={switchboard.clientInterfaceActive} onToggle={() => toggleModule('clientInterfaceActive', 'Manual MCC override')} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {showCloneModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !provisioningStatus && setShowCloneModal(false)} className="absolute inset-0 bg-surface-sidebar/80 backdrop-blur-sm" />
                                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
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
                                            <input type="text" placeholder="ex: Le Grand Paris" className="w-full bg-slate-950 border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all font-medium" value={newCloneName} onChange={(e) => { setNewCloneName(e.target.value); setNewCloneKey(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Subdomain Slug</label>
                                            <input type="text" placeholder="ex: le-grand-paris" className="w-full bg-slate-950 border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all font-mono" value={newCloneKey} onChange={(e) => setNewCloneKey(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Owner Email</label>
                                            <input type="email" placeholder="owner@restaurant.fr" className="w-full bg-slate-950 border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all" value={newCloneEmail} onChange={(e) => setNewCloneEmail(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Tier</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['STANDARD', 'PREMIUM', 'ENTERPRISE'] as const).map((t) => (
                                                    <button key={t} type="button" onClick={() => setNewCloneTier(t)} className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${newCloneTier === t ? 'bg-action-primary/20 border-focus/50 text-brand' : 'bg-slate-950 border-subtle text-secondary hover:border-white/20'}`}>{t}</button>
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
                                                            {i < provisionStep && <span className="text-[8px] text-white">✓</span>}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${i === provisionStep ? 'text-brand' : i < provisionStep ? 'text-status-success/60' : 'text-white/20'}`}>{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex gap-4 pt-4">
                                                <button onClick={() => setShowCloneModal(false)} className="flex-1 py-4 font-bold text-secondary hover:text-white transition-all text-xs uppercase tracking-[0.2em]">Cancel</button>
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
