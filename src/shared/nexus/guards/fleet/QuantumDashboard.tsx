import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeTenantSlotsAtom, fleetSnapshotAtom } from '@/store/fleetAtoms';
import { MacroBrain } from '@domain/services/MacroBrain';
import { QuantumOrchestrator } from '@domain/services/QuantumOrchestrator';
import { logger } from '@/lib/logger';

/**
 * 🛰️ QuantumDashboard - Phase 5 (MCC Industrial Console)
 * A high-fidelity real-time visualization of the entire restaurant empire.
 */
export const QuantumDashboard: React.FC = () => {
    const fleet = useAtomValue(fleetSnapshotAtom);
    const slots = useAtomValue(activeTenantSlotsAtom);

    const consolidated = useMemo(() => MacroBrain.getConsolidatedMetrics(fleet), [fleet]);
    const quantum = useMemo(() => MacroBrain.getQuantumFleetSnapshot(fleet), [fleet]);

    const handleBulkPriceUpdate = async () => {
        const tenantIds = fleet.map(f => f.id);
        const result = await QuantumOrchestrator.bulkUpdatePricing(tenantIds, 1.05); // +5% Price Increase
        alert(`Bulk Update Executed: ${result.success} sites synchronized.`);
    };

    const handleOTADeploy = async () => {
        const tenantIds = fleet.map(f => f.id);
        await QuantumOrchestrator.deployOTA(tenantIds, '1.1.0-quantum', 'https://ota.nexus.io/v1.1.0');
        alert('OTA Signal broadcasted to fleet.');
    };

    return (
        <div className="p-8 bg-slate-950 text-slate-100 min-h-screen font-sans">
            {/* 🛰️ HEADER - Real-time Status */}
            <header className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        QUANTUM ORCHESTRATOR
                    </h1>
                    <p className="text-slate-400 font-mono text-sm mt-2">FLEET STATUS: ACTIVE | NODES: {fleet.length} | SYNC: GRADE VII</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleBulkPriceUpdate}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 transition-all rounded-lg font-bold shadow-lg shadow-blue-900/40"
                    >
                        Bulk Action: Price +5%
                    </button>
                    <button 
                        onClick={handleOTADeploy}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 transition-all rounded-lg font-bold shadow-lg shadow-emerald-900/40"
                    >
                        Deploy OTA v1.1.0
                    </button>
                </div>
            </header>

            {/* 📈 CONSOLIDATED METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <MetricCard label="Global Revenue" value={`${consolidated.totalRevenue.toLocaleString()}€`} trend="+12.4%" />
                <MetricCard label="Fleet Health" value={`${consolidated.averageHealth.toFixed(1)}%`} trend="STABLE" color="text-emerald-400" />
                <MetricCard label="Quantum ROI" value={`${quantum.globalROI}%`} trend="OPTIMIZED" color="text-blue-400" />
                <MetricCard label="Volatility" value={(consolidated.volatilityIndex * 100).toFixed(2)} trend="LOW" color="text-amber-400" />
            </div>

            {/* 🗺️ FLEET TOPOLOGY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Fleet Topology Map</h2>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">LIVE SNAPSHOT</span>
                    </div>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                        {fleet.map((node) => (
                            <div 
                                key={node.id} 
                                title={`${node.name} - Version: ${node.version}`}
                                className={`aspect-square rounded-sm transition-all cursor-pointer hover:scale-110 ${
                                    node.status === 'ONLINE' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-700'
                                }`} 
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                    <h3 className="text-xl font-bold mb-6">Quantum Intelligence</h3>
                    <div className="space-y-4">
                        <InsightLine label="Fleet Entropy" value={`${quantum.fleetEntropy * 100}%`} />
                        <InsightLine label="Arbitrage Potential" value={quantum.arbitrageOpportunities} color="text-blue-400" />
                        <InsightLine label="OTA Staging" value={quantum.otaStagingCount} />
                        <hr className="border-slate-800 my-4" />
                        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <p className="text-xs text-blue-300 font-mono">
                                [ORACLE] Dynamic resource reallocation suggested for Northern Cluster. 4.2% yield increase projected.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ label: string, value: string | number, trend: string, color?: string }> = ({ label, value, trend, color }) => (
    <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</h3>
            <span className="text-[10px] font-mono text-emerald-400">{trend}</span>
        </div>
    </div>
);

const InsightLine: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
        <span className="text-slate-400 text-sm">{label}</span>
        <span className={`font-mono font-bold ${color || 'text-white'}`}>{value}</span>
    </div>
);
