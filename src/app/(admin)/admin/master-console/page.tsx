// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { logger } from '@/lib/axiom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Globe, 
  Loader2, 
  RefreshCw, 
  Plus, 
  Bot, 
  ChevronRight, 
  Activity, 
  Database, 
  ShieldAlert,
  Search,
  CreditCard,
  ArrowUpRight,
  Target,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import { useFleet } from "@/context/FleetContext";
import { ProvisioningWizard } from '@/components/admin/ProvisioningWizard';
import { TenantOrchestrator } from '@/components/fleet/TenantOrchestrator';

export default function MasterConsolePage() {
  const { 
    instances, 
    launchPreview, 
    isSyncing, 
    stats, 
    macroInsights,
    isEmpireMode,
    selectInstance, 
    selectedInstanceId,
    syncFleet, 
    registerInstance,
    broadcastConfiguration
  } = useFleet();

  const triggerRebalancing = (insight: any) => {
    logger.info('[MCC] Rebalancing Triggered', { insight });
    alert(`[Nexus Intelligence] Action Executed: ${insight.message}\nLogic: ${insight.recommendation}`);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const selectedInstance = instances.find(i => i.id === selectedInstanceId);
  const filteredInstances = instances.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-accent/30">
      
      {/* 🧭 MCC RADAR (SIDEBAR) */}
      <div className="w-[380px] border-r border-white/5 bg-[#080808] flex flex-col relative z-20">
        <div className="p-8 border-b border-white/5 bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <Database className="w-5 h-5" />
                </div>
                <div>
                <h1 className="text-xl font-serif italic uppercase tracking-tighter">MCC <small className="text-neutral-500 text-[10px] not-italic ml-1">v4.5</small></h1>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[8px] font-bold text-accent/80 uppercase tracking-widest">Nexus Active</span>
                </div>
                </div>
            </div>
            
            <button 
                onClick={() => setIsWizardOpen(true)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-neutral-400 hover:text-white"
            >
                <Plus size={20} />
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-white transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH NODE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-white/[0.02] border border-white/5 rounded-xl pl-12 pr-4 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-white/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {/* Empire Mode Button */}
            <button
                onClick={() => selectInstance(null)}
                className={cn(
                    "w-full group relative p-5 rounded-[1.5rem] transition-all duration-300 border flex items-center justify-between overflow-hidden mb-4",
                    isEmpireMode 
                        ? "bg-accent/10 border-accent/30 shadow-[0_0_20px_rgba(255,100,100,0.1)]" 
                        : "bg-transparent border-transparent hover:bg-white/[0.02]"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isEmpireMode ? "bg-accent text-white" : "bg-white/5 text-neutral-500"
                    )}>
                        <Layers size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black uppercase tracking-widest">Empire Overview</p>
                        <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-tight">{instances.length} Sites Online</p>
                    </div>
                </div>
            </button>

            <div className="h-px bg-white/5 mx-4 my-4" />

            <div className="flex-1 px-4 overflow-hidden flex flex-col">
                 <TenantOrchestrator />
            </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#080808]">
           <button 
            onClick={() => syncFleet()}
            disabled={isSyncing}
            className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50"
           >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Sync Fleet Intelligence
           </button>
        </div>
      </div>

      {/* 🛸 COMMAND DECK (MAIN) */}
      <main className="flex-1 bg-[#050505] relative overflow-y-auto custom-scrollbar">
        {/* Ambient Neural Gradients */}
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-accent/5 rounded-full blur-[200px] -mr-[500px] -mt-[500px] pointer-events-none" />
        
        <div className="p-16 max-w-7xl mx-auto relative z-10">
          <AnimatePresence mode="wait">
            {isEmpireMode ? (
              <motion.div 
                key="empire"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-16"
              >
                {/* Empire Header */}
                <div className="flex items-end justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent">Nexus Fleet Intelligence</span>
                        </div>
                        <h2 className="text-8xl font-serif italic text-white tracking-tighter leading-none">The Empire.</h2>
                        <p className="text-sm font-bold text-neutral-500 uppercase tracking-[0.3em]">Consolidated Performance Hub • {instances.length} Active Nodes</p>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => broadcastConfiguration({ maintenance: false })}
                            className="px-8 py-4 bg-accent text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Zap className="w-3 h-3 fill-current" />
                            Global Push
                        </button>
                    </div>
                </div>

                {/* Macro KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Revenue Global', value: `€${stats.totalRevenue.toLocaleString()}`, trend: '+12.4%', icon: TrendingUp },
                        { label: 'Labor Cost (Avg)', value: `${stats.consolidated?.totalLaborCost ? '35%' : '---'}`, trend: '-1.2%', icon: Activity },
                        { label: 'Direct Margin', value: `${stats.consolidated?.averageFoodCost ? '71.5%' : '---'}`, trend: 'Target Focus', icon: Target },
                        { label: 'Fleet Health', value: `${Math.round(stats.averageHealth)}%`, trend: 'Stable', icon: ShieldCheck }
                    ].map((stat) => (
                        <div key={stat.label} className="bg-[#0B0B0C] border border-white/5 rounded-[3rem] p-10 hover:border-white/10 transition-all group">
                             <div className="flex items-center justify-between mb-8">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                    <stat.icon className="w-5 h-5 text-accent" />
                                </div>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{stat.trend}</span>
                            </div>
                            <h4 className="text-5xl font-serif italic tracking-tighter mb-1">{stat.value}</h4>
                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em]">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Insights & Strategy Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Macro Insights Dashboard */}
                    <div className="lg:col-span-2 bg-[#0B0B0C] border border-white/5 rounded-[3rem] p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-32 bg-accent" />
                        <h3 className="text-xl font-serif italic mb-10 flex items-center gap-4">
                            <Bot className="w-6 h-6 text-accent" />
                            Macro Strategy Recommendations
                        </h3>
                        
                        <div className="space-y-6">
                            {macroInsights.map((insight, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all group/insight"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                                                    insight.priority === 'high' ? "bg-red-500/20 text-red-500" : "bg-accent/20 text-accent"
                                                )}>
                                                    {insight.type} • {insight.priority}
                                                </span>
                                                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest" title="Estimated ROI">
                                                    ROI Potentiel: +{insight.potentialRoI}€
                                                </span>
                                            </div>
                                            <p className="text-lg font-bold">{insight.message}</p>
                                            <p className="text-xs text-neutral-500">{insight.recommendation}</p>
                                        </div>
                                        <button 
                                            onClick={() => triggerRebalancing(insight)}
                                            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-accent hover:text-white transition-all active:scale-90"
                                            title="Execute Recommendation"
                                        >
                                            <Zap size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Fleet Health Meter */}
                    <div className="bg-[#0B0B0C] border border-white/5 rounded-[3rem] p-12 flex flex-col justify-between">
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.5em]">Network Topology</h3>
                            <div className="space-y-4">
                                {instances.map(inst => (
                                    <div key={inst.id} className="flex items-center justify-between group">
                                        <span className="text-[10px] font-bold text-neutral-400 group-hover:text-white transition-colors">{inst.name}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${inst.metrics.healthScore}%` }}
                                                    className="h-full bg-accent"
                                                />
                                            </div>
                                            <span className="text-[9px] font-mono text-accent">{Math.round(inst.metrics.healthScore)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="w-full h-16 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] font-sans hover:scale-105 transition-all mt-10 shadow-2xl">
                             Export Consolidated FEC
                        </button>
                    </div>
                </div>

                {/* Empire Economy Engine */}
                <div className="bg-gradient-to-r from-[#0B0B0C] to-[#0a0f18] border border-accent/20 rounded-[3rem] p-12">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-serif italic flex items-center gap-4">
                            <CreditCard className="w-6 h-6 text-accent" />
                            Empire Economy
                        </h3>
                        <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Billing Engine Active</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Total Monthly Recurring Revenue</p>
                            <h4 className="text-6xl font-serif italic tracking-tighter text-white">€{instances.length * 49}</h4>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Active Modules Yield</p>
                            <h4 className="text-4xl font-serif italic tracking-tighter text-emerald-400">€{instances.length * 20}</h4>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Locked Delinquent Nodes</p>
                            <h4 className="text-4xl font-serif italic tracking-tighter text-red-500">0</h4>
                        </div>
                    </div>
                </div>

              </motion.div>
            ) : selectedInstance ? (
               <motion.div 
                key={selectedInstanceId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Header Profile */}
                <div className="flex items-start justify-between mb-20 relative group/header">
                  <div className="flex items-center gap-10 relative z-10">
                    <div 
                      className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-2 shadow-2xl relative overflow-hidden"
                      style={{ 
                        backgroundColor: `${(selectedInstance as any).primaryColor || '#FFFFFF'}15`, 
                        borderColor: `${(selectedInstance as any).primaryColor || '#FFFFFF'}30`,
                        boxShadow: `0 30px 60px -12px ${(selectedInstance as any).primaryColor || '#FFFFFF'}20`
                      }}
                    >
                      <Globe className="w-12 h-12" style={{ color: (selectedInstance as any).primaryColor || '#FFFFFF' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">Instance Active</span>
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                           <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Stable</span>
                        </div>
                      </div>
                      <h2 className="text-7xl font-serif italic text-white tracking-tighter uppercase mb-4 leading-none">
                        {selectedInstance.name}
                      </h2>
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.3em] font-mono opacity-60">
                         {selectedInstance.id.toUpperCase()} • {(selectedInstance as any).version || 'OS Core v1.2.0'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 relative z-10">
                    <button 
                      onClick={() => launchPreview(selectedInstance.key)}
                      className="px-10 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                      <Zap size={16} fill="currentColor" />
                      Digital Twin Launch
                    </button>
                  </div>
                </div>

                {/* Dashboard Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { label: 'Revenue 24h', value: `€${(selectedInstance.metrics.dailyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
                      { label: 'System Health', value: `${(selectedInstance.metrics.healthScore || 100).toFixed(1)}%`, icon: Activity, color: 'text-blue-400' },
                      { label: 'Active Users', value: selectedInstance.metrics.activeUsers, icon: Bot, color: 'text-purple-400' }
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#0B0B0C] border border-white/5 rounded-[2.5rem] p-10 hover:bg-[#0E0E0F] transition-all group">
                        <div className="flex items-center justify-between mb-8">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                          </div>
                        </div>
                        <h4 className="text-5xl font-serif italic tracking-tighter mb-1 leading-none">{stat.value}</h4>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">{stat.label}</p>
                      </div>
                    ))}
                </div>

                {/* Sovereign Billing Control */}
                <div className="mt-8 bg-[#0B0B0C] border border-red-500/10 rounded-[2.5rem] p-10 flex items-center justify-between group hover:border-red-500/30 transition-all">
                    <div>
                        <h3 className="text-lg font-serif italic mb-2 flex items-center gap-3">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            Sovereign Lock (Billing)
                        </h3>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500">Simulate Stripe webhook for payment failure.</p>
                    </div>
                    <button 
                        onClick={() => broadcastConfiguration({ licenceStatus: 'locked' })}
                        className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                        Trigger Lockout
                    </button>
                </div>
                
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {isWizardOpen && (
            <ProvisioningWizard 
                onClose={() => setIsWizardOpen(false)} 
                onSuccess={(newInstance) => {
                    registerInstance(newInstance);
                    setIsWizardOpen(false);
                    selectInstance(newInstance.id);
                }} 
            />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
