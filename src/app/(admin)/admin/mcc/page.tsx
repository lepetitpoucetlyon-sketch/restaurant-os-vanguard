'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Rocket, 
  LayoutGrid, 
  Settings, 
  Activity, 
  Plus, 
  Search,
  Bell,
  Lock,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Zap,
  Cpu,
  Award,
  Thermometer,
  Wallet,
  BrainCircuit
} from 'lucide-react';
import { ProvisioningEngine } from '@domain/services/ProvisioningEngine';
import { EmpireInstance } from '@domain/types/empire';


// MCC Components
import { 
  MCCAuditStream, 
  MCCInsights, 
  CertificationCenter, 
  FiscalChainExplorer, 
  DeploymentEngine, 
  MCCTreasury, 
  StrategyOracle,
  FleetCommandTable,
  PerformanceMonitor
} from '@nexus/guards';
import { VoiceAssistantOverlay } from '@/components/layout/VoiceAssistantOverlay';
import { useNexusFleet } from '@/engines/fleet/NexusFleetProvider';
import { AmbientAudio } from '@/components/layout/AmbientAudio';

/**
 * 👑 Master Command Control (MCC) Dashboard
 * Central orchestrator for the 10,000 instances fleet.
 */
export default function MCCDashboard() {
  const { 
    instances, 
    globalMetrics, 
    isLoading, 
    refreshFleet 
  } = useNexusFleet();

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'fleet' | 'compliance' | 'intelligence' | 'treasury'>('fleet');
  const [newCloneName, setNewCloneName] = useState('');
  const [newCloneKey, setNewCloneKey] = useState('');
  const [provisioningStatus, setProvisioningStatus] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateClone = async () => {
    if (!newCloneName || !newCloneKey) return;
    
    setProvisioningStatus('Initializing Cloud Resources...');
    try {
      const newInst = await ProvisioningEngine.provisionNewInstance({
        name: newCloneName,
        key: newCloneKey,
        ownerEmail: 'admin@empire.com',
        initialPrimaryColor: '#6366f1',
        tier: 'STANDARD',
        copyBaseTemplates: true
      });

      // Simulation injection
      refreshFleet();
      
      // Success! - zero delay mandate
      setProvisioningStatus('Success! Clone Active.');
      setShowCloneModal(false);
      setProvisioningStatus(null);
      setNewCloneName('');
      setNewCloneKey('');
    } catch (err) {
      setProvisioningStatus('Critical Error in Provisioning.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-8 font-sans selection:bg-indigo-500/30">
      <VoiceAssistantOverlay />
      
      {/* Header MCC */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Rocket className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Master Console</h1>
            <p className="text-gray-500 text-sm font-medium">Empire Orchestrator • v4.0.0-NEXUS</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AmbientAudio />
          
          <button 
            onClick={() => refreshFleet()}
            disabled={isLoading}
            className={`flex items-center gap-2 bg-[#161618] border border-white/5 px-4 py-2.5 rounded-xl hover:bg-[#1c1c1f] transition-all active:scale-95 ${isLoading ? 'opacity-50' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Global Sync</span>
          </button>
          
          <div className="flex items-center gap-2 bg-[#161618] border border-white/5 px-4 py-2.5 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Axiom Bridge Connected</span>
          </div>
          
          <div className="w-px h-10 bg-white/5 mx-2" />
          
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
            AD
          </div>
        </div>
      </header>

      {/* MCC Tabs */}
      <div className="flex gap-8 border-b border-white/5 mb-10">
        <TabButton 
          active={activeTab === 'fleet'} 
          onClick={() => setActiveTab('fleet')} 
          label="Fleet Management" 
          icon={<LayoutGrid className="w-4 h-4" />}
        />
        <TabButton 
          active={activeTab === 'compliance'} 
          onClick={() => setActiveTab('compliance')} 
          label="Compliance & Certification" 
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <TabButton 
          active={activeTab === 'intelligence'} 
          onClick={() => setActiveTab('intelligence')} 
          label="Empire Oracle" 
          icon={<BrainCircuit className="w-4 h-4" />}
        />
        <TabButton 
          active={activeTab === 'treasury'} 
          onClick={() => setActiveTab('treasury')} 
          label="Treasury & Logistics" 
          icon={<Wallet className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Fleet Management / Compliance / Intelligence */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          <AnimatePresence mode="wait">
            {activeTab === 'fleet' && (
              <motion.div 
                key="fleet" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Stats Fleet */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <StatCard 
                    label="Total Instances" 
                    value={instances.length.toString()} 
                    icon={<LayoutGrid className="text-indigo-400" />} 
                    trend="Fleet capacity at 100%"
                  />
                  <StatCard 
                    label="Global Revenue" 
                    value={`€${((globalMetrics?.fleetTotalRevenue || 0) / 100).toLocaleString()}`} 
                    icon={<TrendingUp className="text-emerald-400" />} 
                    trend="Calculated in real-time"
                  />
                  <StatCard 
                    label="Fleet Health" 
                    value={`${Math.round(globalMetrics?.averageHealthScore || 100)}%`} 
                    icon={<Activity className="text-blue-400" />} 
                    trend="Weighted average"
                  />
                  <StatCard 
                    label="Global Compliance" 
                    value={`${globalMetrics?.averageComplianceScore?.toFixed(1) || '100'}%`} 
                    icon={<ShieldCheck className="text-indigo-400" />} 
                    trend="NF525 Integrity Level"
                  />

                </div>

                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Fleet Tactical Overview</h3>
                   <button 
                    onClick={() => setShowCloneModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest text-[10px]"
                  >
                    <Plus className="w-4 h-4" />
                    New Clone
                  </button>
                </div>

                <FleetCommandTable />
              </motion.div>
            )}

            {activeTab === 'compliance' && (
              <motion.div 
                key="compliance" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-12 gap-8"
              >
                <div className="col-span-12 xl:col-span-8">
                  <CertificationCenter />
                </div>
                <div className="col-span-12 xl:col-span-4">
                  <FiscalChainExplorer />
                </div>
              </motion.div>
            )}

            {activeTab === 'intelligence' && (
              <motion.div 
                key="intelligence" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
              >
                <StrategyOracle />
              </motion.div>
            )}

            {activeTab === 'treasury' && (
              <motion.div 
                key="treasury" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
              >
                <MCCTreasury />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Intelligence & Telemetry (Visible on Fleet Tab) */}
        {activeTab === 'fleet' && (
          <div className="col-span-12 lg:col-span-4 space-y-8">
              <PerformanceMonitor />
              <DeploymentEngine />
              <MCCInsights />
              <MCCAuditStream />
              
              {/* System Status Panel */}
              <div className="p-6 bg-[#161618] border border-white/5 rounded-3xl">
                  <div className="flex items-center gap-3 mb-6">
                      <Cpu className="w-5 h-5 text-indigo-400 mt-0.5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">MCC Core Status</h3>
                  </div>
                  <div className="space-y-4">
                      <StatusItem label="Provisioning Engine" status="Ready" color="bg-green-500" />
                      <StatusItem label="Axiom Log Ingest" status="Streaming" color="bg-green-500" />
                      <StatusItem label="NF525 Seal Engine" status="Secured" color="bg-indigo-500" />
                      <StatusItem label="Fleet Intelligence" status="Aggregating" color="bg-violet-500" />
                  </div>
              </div>
          </div>
        )}
      </div>

      {/* Clone Modal (Birth of a Clone) */}
      <AnimatePresence>
        {showCloneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !provisioningStatus && setShowCloneModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#161618] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                  <Rocket className="text-indigo-400 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight">Birth of a New Clone</h2>
                  <p className="text-gray-500 text-sm">DNA Injection & Infrastructure</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1 tracking-widest">Instance Name</label>
                  <input 
                    type="text" 
                    placeholder="ex: Le Grand Paris" 
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    value={newCloneName}
                    onChange={(e) => {
                      setNewCloneName(e.target.value);
                      setNewCloneKey(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1 tracking-widest">Subdomain Slug</label>
                  <input 
                    type="text" 
                    placeholder="ex: le-grand-paris" 
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                    value={newCloneKey}
                    onChange={(e) => setNewCloneKey(e.target.value)}
                  />
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-indigo-400 shrink-0" />
                  <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tighter">
                    Policy: Toutes les instances sont provisionnées avec NF525 et 2FA activés par défaut (STANDARD_DNA_V3).
                  </p>
                </div>

                {provisioningStatus ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3.5 }}
                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      />
                    </div>
                    <span className="text-[10px] font-black text-indigo-400 animate-pulse uppercase tracking-[0.2em]">{provisioningStatus}</span>
                  </div>
                ) : (
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setShowCloneModal(false)}
                      className="flex-1 py-4 font-bold text-gray-500 hover:text-white transition-all text-xs uppercase tracking-[0.2em]"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateClone}
                      className="flex-1 bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-95 text-xs uppercase tracking-[0.2em]"
                    >
                      Launch Birth
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, trend, isWarning = false }: { label: string, value: string, icon: React.ReactNode, trend: string, isWarning?: boolean }) {
  return (
    <div className={`p-6 bg-[#161618] border ${isWarning ? 'border-amber-500/20' : 'border-white/5'} rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-all">
          {icon}
        </div>
        {isWarning && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
      </div>
      <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</h3>
      <div className="text-3xl font-black mb-2 tracking-tighter">{value}</div>
      <p className="text-[10px] font-medium text-gray-600 uppercase tracking-tighter">{trend}</p>
      
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
    </div>
  );
}

function InstanceRow({ instance, index }: { instance: EmpireInstance, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="grid grid-cols-12 px-6 py-5 bg-[#161618] border border-white/5 rounded-2xl hover:border-indigo-500/30 hover:bg-[#1a1a1d] transition-all cursor-pointer group"
    >
      <div className="col-span-4 flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner" 
          style={{ backgroundColor: `${instance.branding.primaryColor}20`, color: instance.branding.primaryColor, border: `1px solid ${instance.branding.primaryColor}40` }}
        >
          {instance.name.substring(0, 2)}
        </div>
        <div>
          <h4 className="font-bold text-sm tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{instance.name}</h4>
          <p className="text-gray-600 text-[10px] font-mono tracking-tighter uppercase">{instance.key}.nexus-fleet.io</p>
        </div>
      </div>

      <div className="col-span-3 flex items-center">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
             <span className="text-[10px] font-bold text-gray-300 uppercase">Health {instance.metrics.healthScore}%</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-tighter">NF525 SEALED</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-tighter">HACCP GUARD ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="col-span-3 flex items-center">
        <div className="text-sm font-black text-gray-300 tracking-tight">
          €{Math.round(instance.metrics.dailyRevenue).toLocaleString()}
          <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{instance.metrics.activeUsers} Sessions Actives</span>
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-end gap-3">
        <StatusBadge status={instance.status} />
        
        {/* Compliance Action */}
        <button 
          title="Certifier l'instance"
          className="p-2 hover:bg-amber-500/10 rounded-lg transition-all text-gray-600 hover:text-amber-500 group/cert"
        >
          <Award className="w-5 h-5" />
        </button>

        <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-600 hover:text-white">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PROVISIONING: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    ONLINE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    MAINTENANCE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOCKED: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest animate-in fade-in ${styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
      {status}
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`pb-4 px-2 flex items-center gap-2 border-b-2 transition-all ${active ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
    >
      <div className={`${active ? 'text-indigo-400' : 'text-gray-600'}`}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="activeTabDot" className="w-1 h-1 rounded-full bg-indigo-400" />}
    </button>
  );
}

function StatusItem({ label, status, color }: { label: string, status: string, color: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{status}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
            </div>
        </div>
    );
}
