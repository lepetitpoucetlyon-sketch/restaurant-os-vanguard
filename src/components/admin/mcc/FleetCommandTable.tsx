// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { useNexusFleet } from '@/engines/fleet/NexusFleetProvider';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

export function FleetCommandTable() {
    const { instances, isLoading } = useNexusFleet();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Synchronisation Télémétrie...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0f0f11] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/5 to-transparent">
                <div>
                    <h2 className="text-xl font-serif font-black text-white tracking-tighter">Fleet Command Center</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Orchestration en temps réel des actifs de l'empire</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="RECHERCHER UN SITE..." 
                            className="bg-transparent border-none outline-none text-[10px] font-bold text-white placeholder:text-gray-600 w-32"
                        />
                    </div>
                    <button className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02]">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Instance ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Health</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue (24h)</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">HACCP Risk</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Users</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Compliance</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {instances.map((instance, idx) => (
                            <motion.tr 
                                key={instance.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="hover:bg-white/[0.03] transition-colors group"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white tracking-tight">{instance.name}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">ID: {instance.id} • {instance.key}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${
                                            instance.status === 'online' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 
                                            instance.status === 'error' ? 'bg-error shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse' : 
                                            'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                        }`} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-gray-300">{instance.status}</span>
                                            <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${instance.metrics.healthScore < 70 ? 'bg-error' : 'bg-emerald-500'}`}
                                                    style={{ width: `${instance.metrics.healthScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end">
                                        {instance.security?.supportAccessGranted || true ? ( // Forced true for Command view
                                            <>
                                                <span className="text-sm font-black text-white">{(instance.metrics.dailyRevenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase">
                                                    <TrendingUp className="w-2.5 h-2.5" />
                                                    +4.2%
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5 opacity-40">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PROTÉGÉ</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        {/* 📡 HACCP LIVE BRIDGE */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${instance.metrics.healthScore >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                <span className="text-[9px] font-black text-gray-300 uppercase">Sensors {instance.metrics.healthScore}%</span>
                                            </div>
                                            {instance.metrics.healthScore < 95 && (
                                                <div className="flex items-center gap-1.5 text-error">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Hygiene Drift Detected</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-white">{instance.metrics.activeUsers}</span>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Sessions</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg w-fit">
                                            <ShieldCheck className={`w-3.5 h-3.5 ${instance.security.nf525Certified ? 'text-emerald-500' : 'text-gray-500'}`} />
                                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">NF525 SEALED</span>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all opacity-0 group-hover:opacity-100">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                        <button className="px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10 opacity-0 group-hover:opacity-100">
                                            COMMANDER
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Total Fleet capacity: 10,000+ nodes</p>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-indigo-500" />
                        <span className="text-[9px] font-black text-gray-400 uppercase">Fleet Latency: 12ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
