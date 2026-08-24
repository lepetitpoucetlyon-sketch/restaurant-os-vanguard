'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Rocket, LayoutGrid,
    Lock, RefreshCw, GitMerge, BrainCircuit, Wallet, Puzzle, Activity,
    Network, BookOpen, Database, Hammer, EyeOff, Target, Palette, Sliders
} from 'lucide-react';

import { MFAGate } from './components/MFAGate';
import { useMccPage, PROV_STEPS } from './_hooks/useMccPage';
import { useSovereignSwitchboard } from '@/shared/hooks/useSovereignSwitchboard';
import { MCCLocaleProvider, useMCCLocale, LocaleToggle } from './_i18n';
import { PLATFORM_VARIANTS, VERTICAL_META } from '@/modules/system';
import { MCC_TABS_REGISTRY } from './_tabs/registry';

const FleetTab        = MCC_TABS_REGISTRY.fleet;
const FleetSidebar    = MCC_TABS_REGISTRY.fleetSidebar;
const ComplianceTab   = MCC_TABS_REGISTRY.compliance;
const IntelligenceTab = MCC_TABS_REGISTRY.intelligence;
const TreasuryTab     = MCC_TABS_REGISTRY.treasury;
const PatchCenterTab  = MCC_TABS_REGISTRY.patchcenter;
const PluginsTab      = MCC_TABS_REGISTRY.plugins;
const EventBusTab     = MCC_TABS_REGISTRY.eventbus;
const LifecycleTab    = MCC_TABS_REGISTRY.lifecycle;
const TutorialTab     = MCC_TABS_REGISTRY.tutorial;
const SystemTenantsTab = MCC_TABS_REGISTRY.systemtenants;
const ForgeStudioTab   = MCC_TABS_REGISTRY.forgestudio;
const SectorStudyTab   = MCC_TABS_REGISTRY.sectorstudy;
const BlindSpotTab     = MCC_TABS_REGISTRY.blindspot;
const QualificationTab = MCC_TABS_REGISTRY.qualification;
const DeriversTab      = MCC_TABS_REGISTRY.derivers;
const ScrapeCharterTab = MCC_TABS_REGISTRY.scrapecharter;

export default function MCCDashboard() {
    return (
        <MCCLocaleProvider>
            <MCCDashboardInner />
        </MCCLocaleProvider>
    );
}

function MCCDashboardInner() {
    const { t } = useMCCLocale();

    const {
        instances, globalMetrics, isLoading, refreshFleet,
        health, userInitials,
        showCloneModal, setShowCloneModal,
        activeTab, setActiveTab,
        newCloneName, setNewCloneName,
        newCloneKey, setNewCloneKey,
        newCloneEmail, setNewCloneEmail,
        newCloneTier, setNewCloneTier,
        newCloneVariant, setNewCloneVariant,
        newTrialDays, setNewTrialDays,
        newCloneBrandingMode, setNewCloneBrandingMode,
        newCloneAccentColor, setNewCloneAccentColor,
        newCloneLogoUrl, setNewCloneLogoUrl,
        newCloneSplashEnabled, setNewCloneSplashEnabled,
        newCloneDisplayDepth, setNewCloneDisplayDepth,
        provisioningStatus, provisionStep,
        handleCreateClone,
    } = useMccPage();

    const { state: switchboard, toggleModule } = useSovereignSwitchboard();

    const TABS = [
        { id: 'fleet',          label: t.tabs.fleet,          icon: <LayoutGrid className="w-4 h-4" /> },
        { id: 'forgestudio',    label: 'Studio Forge',        icon: <Hammer className="w-4 h-4" /> },
        { id: 'scrapecharter',  label: 'Scrape Charte',       icon: <Palette className="w-4 h-4" /> },
        { id: 'blindspot',      label: 'Angles Morts',        icon: <EyeOff className="w-4 h-4" /> },
        { id: 'qualification',  label: 'Qualification',      icon: <Target className="w-4 h-4" /> },
        { id: 'derivers',       label: '11 Dérivateurs',      icon: <Sliders className="w-4 h-4" /> },
        { id: 'sectorstudy',    label: 'Études Sectorielles', icon: <Database className="w-4 h-4" /> },
        { id: 'compliance',     label: t.tabs.compliance,     icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'intelligence',   label: t.tabs.intelligence,   icon: <BrainCircuit className="w-4 h-4" /> },
        { id: 'treasury',       label: t.tabs.treasury,       icon: <Wallet className="w-4 h-4" /> },
        { id: 'patchcenter',    label: t.tabs.patchcenter,    icon: <GitMerge className="w-4 h-4" /> },
        { id: 'plugins',        label: t.tabs.plugins,        icon: <Puzzle className="w-4 h-4" /> },
        { id: 'eventbus',       label: t.tabs.eventbus,       icon: <Activity className="w-4 h-4" /> },
        { id: 'lifecycle',      label: t.tabs.lifecycle,      icon: <Network className="w-4 h-4" /> },
        { id: 'tutorial',       label: 'CLI & Guide',          icon: <BookOpen  className="w-4 h-4" /> },
        { id: 'systemtenants',  label: 'Tenants Système',      icon: <Database  className="w-4 h-4" /> },
    ] as const;

    return (
        <MFAGate>
            <div className="min-h-screen bg-surface-bg text-text-primary font-sans selection:bg-action-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-action-primary/8 blur-[140px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-action-primary/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative z-10 p-8">
                    <header className="flex flex-wrap gap-4 justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-tr from-action-primary to-action-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Rocket className="text-text-primary w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight uppercase">{t.header.title}</h1>
                                <p className="text-secondary text-sm font-medium">{t.header.subtitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <LocaleToggle />
                            <button onClick={() => refreshFleet()} disabled={isLoading} className={`flex items-center gap-2 bg-surface-card border border-border-subtle px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-all active:scale-95 ${isLoading ? 'opacity-50' : ''}`}>
                                <RefreshCw className={`w-4 h-4 text-brand ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-muted">{t.header.globalSync}</span>
                            </button>
                            <div className="hidden sm:flex items-center gap-2 bg-surface-card border border-border-subtle px-3 py-2.5 rounded-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{t.header.axiomBridge}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-action-primary/20 border border-focus/30 flex items-center justify-center font-bold text-brand">{userInitials}</div>
                        </div>
                    </header>

                    <div className="overflow-x-auto scrollbar-none -mx-8 px-8 mb-10">
                        <div className="flex gap-6 border-b border-border-subtle min-w-max">
                            {TABS.map(tab => (
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
                                {activeTab === 'plugins' && (
                                    <motion.div key="plugins" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <PluginsTab />
                                    </motion.div>
                                )}
                                {activeTab === 'eventbus' && (
                                    <motion.div key="eventbus" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <EventBusTab />
                                    </motion.div>
                                )}
                                {activeTab === 'lifecycle' && (
                                    <motion.div key="lifecycle" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <LifecycleTab />
                                    </motion.div>
                                )}
                                {activeTab === 'tutorial' && (
                                    <motion.div key="tutorial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <TutorialTab />
                                    </motion.div>
                                )}
                                {activeTab === 'systemtenants' && (
                                    <motion.div key="systemtenants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <SystemTenantsTab />
                                    </motion.div>
                                )}
                                {activeTab === 'forgestudio' && (
                                    <motion.div key="forgestudio" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <ForgeStudioTab />
                                    </motion.div>
                                )}
                                {activeTab === 'scrapecharter' && (
                                    <motion.div key="scrapecharter" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <ScrapeCharterTab />
                                    </motion.div>
                                )}
                                {activeTab === 'blindspot' && (
                                    <motion.div key="blindspot" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <BlindSpotTab />
                                    </motion.div>
                                )}
                                {activeTab === 'qualification' && (
                                    <motion.div key="qualification" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <QualificationTab />
                                    </motion.div>
                                )}
                                {activeTab === 'derivers' && (
                                    <motion.div key="derivers" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <DeriversTab />
                                    </motion.div>
                                )}
                                {activeTab === 'sectorstudy' && (
                                    <motion.div key="sectorstudy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <SectorStudyTab />
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
                                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-surface-bg/90 backdrop-blur-xl border border-border-subtle rounded-3xl p-8 shadow-2xl overflow-hidden">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-action-primary/20 rounded-2xl flex items-center justify-center">
                                            <Rocket className="text-brand w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold uppercase tracking-tight">{t.clone.title}</h2>
                                            <p className="text-secondary text-sm">{t.clone.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">{t.clone.instanceName}</label>
                                            <input type="text" placeholder={t.clone.instanceNamePlaceholder} className="w-full bg-surface-bg border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all font-medium" value={newCloneName} onChange={(e) => { setNewCloneName(e.target.value); setNewCloneKey(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">{t.clone.subdomainSlug}</label>
                                            <input type="text" placeholder={t.clone.subdomainSlugPlaceholder} className="w-full bg-surface-bg border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all font-mono" value={newCloneKey} onChange={(e) => setNewCloneKey(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">{t.clone.ownerEmail}</label>
                                            <input type="email" placeholder={t.clone.ownerEmailPlaceholder} className="w-full bg-surface-bg border border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-focus/50 transition-all" value={newCloneEmail} onChange={(e) => setNewCloneEmail(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Secteur d&apos;activité</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {PLATFORM_VARIANTS.map(v => (
                                                    <button key={v} type="button" onClick={() => setNewCloneVariant(v)}
                                                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl border text-center transition-all ${newCloneVariant === v ? 'bg-action-primary/10 border-focus/50' : 'bg-surface-bg border-subtle hover:border-border-subtle'}`}>
                                                        <span className="text-xl">{VERTICAL_META[v].emoji}</span>
                                                        <span className={`text-chip-label-sm ${newCloneVariant === v ? 'text-brand' : 'text-secondary'}`}>{VERTICAL_META[v].label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-3 ml-1 tracking-widest">{t.clone.tier}</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['STANDARD', 'PREMIUM', 'ENTERPRISE'] as const).map((tier) => {
                                                    const info = t.clone.tiers[tier] as { tagline?: string, price: string, period?: string, features: readonly string[] };
                                                    const active = newCloneTier === tier;
                                                    return (
                                                        <button key={tier} type="button" onClick={() => setNewCloneTier(tier)}
                                                            className={`relative flex flex-col items-start p-3 rounded-2xl text-left transition-all border ${active ? 'bg-action-primary/10 border-focus/50' : 'bg-surface-bg border-subtle hover:border-border-subtle'}`}>
                                                            {tier === 'PREMIUM' && (
                                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-action-primary text-text-primary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                    {info.tagline}
                                                                </span>
                                                            )}
                                                            <span className={`text-chip-label-sm mb-1 ${active ? 'text-brand' : 'text-secondary'}`}>{tier}</span>
                                                            <span className={`text-base font-black leading-none ${active ? 'text-brand' : 'text-text-primary'}`}>{info.price}</span>
                                                            {info.period && <span className="text-[9px] text-muted mb-2">{info.period}</span>}
                                                            <ul className="mt-2 space-y-1 w-full">
                                                                {info.features.map((f: string) => (
                                                                    <li key={f} className="flex items-start gap-1">
                                                                        <span className={`text-[8px] mt-0.5 ${active ? 'text-brand' : 'text-status-success'}`}>✓</span>
                                                                        <span className="text-[8px] text-muted leading-tight">{f}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-2 ml-1 tracking-widest">Période d&apos;essai</label>
                                            <div className="flex gap-2">
                                                {([7, 14, 30] as const).map(days => (
                                                    <button key={days} type="button" onClick={() => setNewTrialDays(days)}
                                                        className={`flex-1 py-2.5 rounded-xl text-chip-label transition-all border ${newTrialDays === days ? 'bg-action-primary/10 border-focus/50 text-brand' : 'bg-surface-bg border-subtle text-secondary hover:border-border-subtle'}`}>
                                                        {days}j
                                                    </button>
                                                ))}
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={365}
                                                        value={![7, 14, 30].includes(newTrialDays) ? newTrialDays : ''}
                                                        placeholder="Jours"
                                                        onChange={e => {
                                                            const v = parseInt(e.target.value, 10);
                                                            if (!isNaN(v) && v > 0) setNewTrialDays(v);
                                                        }}
                                                        onFocus={() => { if ([7, 14, 30].includes(newTrialDays)) setNewTrialDays(0); }}
                                                        className={`w-full py-2.5 px-3 rounded-xl text-[10px] font-black text-center transition-all border bg-surface-bg focus:outline-none ${![7, 14, 30].includes(newTrialDays) && newTrialDays > 0 ? 'border-focus/50 text-brand' : 'border-subtle text-secondary'}`}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-muted mt-1.5 ml-1">
                                                {newTrialDays > 0 ? `Expire le ${new Date(Date.now() + newTrialDays * 86_400_000).toLocaleDateString('fr-FR')} — paiement requis ensuite` : 'Compte actif immédiatement'}
                                            </p>
                                        </div>

                                        {/* ── Profondeur Métier Initiale ── */}
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-3 ml-1 tracking-widest">Niveau de Profondeur Initial</label>
                                            <div className="grid grid-cols-3 gap-2 mb-4">
                                                {[
                                                    { id: 'essential', label: 'Focus (Essentiel)', icon: '⚡', desc: 'Artisan / Solo · 3 boutons · Pilote auto' },
                                                    { id: 'manager', label: 'Gestion (Standard)', icon: '📊', desc: 'TPE / PME · Marges, planning, stocks' },
                                                    { id: 'enterprise', label: 'Expert (Enterprise)', icon: '🔍', desc: 'Grand compte · Grand Livre, FEC, IoT' },
                                                ].map(d => (
                                                    <button key={d.id} type="button" onClick={() => setNewCloneDisplayDepth(d.id as 'essential' | 'manager' | 'enterprise')}
                                                        className={`flex flex-col p-3 rounded-2xl border text-left transition-all ${newCloneDisplayDepth === d.id ? 'bg-action-primary/10 border-focus/50' : 'bg-surface-bg border-subtle hover:border-border-subtle'}`}>
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="text-sm">{d.icon}</span>
                                                            <p className={`text-[9px] font-black uppercase tracking-wider truncate ${newCloneDisplayDepth === d.id ? 'text-brand' : 'text-secondary'}`}>
                                                                {d.label}
                                                            </p>
                                                        </div>
                                                        <p className="text-[7.5px] text-muted leading-tight">
                                                            {d.desc}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* ── Charte Graphique ── */}
                                        <div>
                                            <label className="block text-xs font-black text-secondary uppercase mb-3 ml-1 tracking-widest">Charte Graphique</label>
                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                {(['default', 'custom'] as const).map(m => (
                                                    <button key={m} type="button" onClick={() => setNewCloneBrandingMode(m)}
                                                        className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${newCloneBrandingMode === m ? 'bg-action-primary/10 border-focus/50' : 'bg-surface-bg border-subtle hover:border-border-subtle'}`}>
                                                        <span className="text-base">{m === 'default' ? '🏢' : '🎨'}</span>
                                                        <div>
                                                            <p className={`text-chip-label ${newCloneBrandingMode === m ? 'text-brand' : 'text-secondary'}`}>
                                                                {m === 'default' ? 'Restaurant OS' : 'Personnalisé'}
                                                            </p>
                                                            <p className="text-[8px] text-muted leading-tight mt-0.5">
                                                                {m === 'default' ? 'Branding standard (gold/dark)' : 'Logo + couleurs du client'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            {newCloneBrandingMode === 'custom' && (
                                                <div className="space-y-3 p-4 bg-surface-card/50 border border-subtle rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <label className="block text-[9px] font-black text-secondary uppercase tracking-widest mb-1">Couleur principale</label>
                                                            <div className="flex items-center gap-2">
                                                                <input type="color" value={newCloneAccentColor} onChange={e => setNewCloneAccentColor(e.target.value)}
                                                                    className="w-9 h-9 rounded-xl border border-subtle cursor-pointer bg-transparent p-0.5" />
                                                                <input type="text" value={newCloneAccentColor} onChange={e => setNewCloneAccentColor(e.target.value)}
                                                                    className="w-24 bg-surface-bg border border-subtle rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:border-focus/50" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[9px] font-black text-secondary uppercase tracking-widest mb-1">Aperçu</label>
                                                            <div className="h-9 rounded-xl border border-subtle flex items-center justify-center"
                                                                style={{ background: `linear-gradient(135deg, ${newCloneAccentColor}22 0%, ${newCloneAccentColor}08 100%)`, borderColor: `${newCloneAccentColor}40` }}>
                                                                <span className="text-chip-label" style={{ color: newCloneAccentColor }}>Aperçu</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-secondary uppercase tracking-widest mb-1">URL Logo (optionnel)</label>
                                                        <input type="url" placeholder="https://cdn.exemple.com/logo.svg"
                                                            value={newCloneLogoUrl} onChange={e => setNewCloneLogoUrl(e.target.value)}
                                                            className="w-full bg-surface-bg border border-subtle rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-focus/50 font-mono" />
                                                        <p className="text-[8px] text-muted mt-1">PNG / SVG recommandé · fond transparent</p>
                                                    </div>
                                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                                        <div className={`w-9 h-5 rounded-full transition-colors relative ${newCloneSplashEnabled ? 'bg-action-primary' : 'bg-border-subtle'}`}
                                                            onClick={() => setNewCloneSplashEnabled(v => !v)}>
                                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${newCloneSplashEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-chip-label text-text-primary">Splash screen</p>
                                                            <p className="text-[8px] text-muted">Écran de démarrage branded à l&apos;ouverture de l&apos;app</p>
                                                        </div>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-action-primary/5 border border-focus/10 rounded-2xl flex items-center gap-3">
                                            <Lock className="w-5 h-5 text-brand shrink-0" />
                                            <p className="text-[10px] text-muted leading-relaxed uppercase tracking-tighter">{t.clone.policy}</p>
                                        </div>
                                        {provisioningStatus ? (
                                            <div className="flex flex-col py-4 gap-3">
                                                {PROV_STEPS.map((step, i) => (
                                                    <div key={step} className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${i < provisionStep ? 'bg-status-success border-emerald-500' : i === provisionStep ? 'border-brand animate-pulse bg-action-primary/20' : 'border-border-subtle'}`}>
                                                            {i < provisionStep && <span className="text-[8px] text-text-primary">✓</span>}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${i === provisionStep ? 'text-brand' : i < provisionStep ? 'text-status-success/60' : 'text-text-primary/20'}`}>{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex gap-4 pt-4">
                                                <button onClick={() => setShowCloneModal(false)} className="flex-1 py-4 font-bold text-secondary hover:text-text-primary transition-all text-xs uppercase tracking-[0.2em]">{t.clone.cancel}</button>
                                                <button onClick={handleCreateClone} className="flex-1 bg-surface-card text-primary font-black py-4 rounded-2xl hover:bg-surface-bg transition-all active:scale-95 text-xs uppercase tracking-[0.2em]">{t.clone.launch}</button>
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
