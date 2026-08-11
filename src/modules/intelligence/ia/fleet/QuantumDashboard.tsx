import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeTenantSlotsAtom, fleetSnapshotAtom } from '@nexus/state/SovereignGenome';
import { MacroBrain } from '@modules/intelligence/services/MacroBrain';
import { QuantumOrchestrator } from './QuantumOrchestrator';
import { EmpireInstance } from '@nexus/contracts';

/**
 * 🛰️ QuantumDashboard - Phase 5 (MCC Industrial Console)
 * A high-fidelity real-time visualization of the entire restaurant empire.
 */
export const QuantumDashboard: React.FC = () => {
    const fleet = useAtomValue(fleetSnapshotAtom);
    const _slots = useAtomValue(activeTenantSlotsAtom);

    const consolidated = useMemo(() => MacroBrain.getConsolidatedMetrics(fleet as unknown as EmpireInstance[]), [fleet]);
    const quantum = useMemo(() => MacroBrain.getQuantumFleetSnapshot(fleet as unknown as EmpireInstance[]), [fleet]);

    const handleBulkPriceUpdate = async () => {
        const tenantIds = fleet.map(f => f.id);
        const result = await QuantumOrchestrator.bulkUpdatePricing(tenantIds, 1.05);
        alert(`Bulk Update Executed: ${result.success} sites synchronized.`);
    };

    const handleOTADeploy = async () => {
        const tenantIds = fleet.map(f => f.id);
        await QuantumOrchestrator.deployOTA(tenantIds, '1.1.0-quantum', 'https://ota.nexus.io/v1.1.0');
        alert('OTA Signal broadcasted to fleet.');
    };

    return (
        <div className="p-8 bg-surface-bg text-muted min-h-screen font-sans">
            <header className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-action-primary to-status-success bg-clip-text text-transparent">
                        QUANTUM ORCHESTRATOR
                    </h1>
                    <p className="text-muted font-mono text-sm mt-2">FLEET STATUS: ACTIVE | NODES: {fleet.length} | SYNC: GRADE VII</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleBulkPriceUpdate}
                        className="px-6 py-2 bg-action-primary hover:bg-action-primary transition-all rounded-lg font-bold shadow-lg shadow-blue-900/40"
                    >
                        Bulk Action: Price +5%
                    </button>
                    <button 
                        onClick={handleOTADeploy}
                        className="px-6 py-2 bg-status-success hover:bg-status-success transition-all rounded-lg font-bold shadow-lg shadow-emerald-900/40"
                    >
                        Deploy OTA v1.1.0
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <MetricCard label="Global Revenue" value={`${consolidated.totalRevenue.toLocaleString()}€`} trend="+12.4%" />
                <MetricCard label="Fleet Health" value={`${consolidated.averageHealth.toFixed(1)}%`} trend="STABLE" color="text-status-success" />
                <MetricCard label="Quantum ROI" value={`${quantum.globalROI}%`} trend="OPTIMIZED" color="text-brand" />
                <MetricCard label="Volatility" value={(consolidated.volatilityIndex * 100).toFixed(2)} trend="LOW" color="text-status-warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-surface-sidebar/50 border border-default rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Fleet Topology Map</h2>
                        <span className="px-3 py-1 bg-status-success/10 text-status-success text-xs rounded-full border border-emerald-500/20">LIVE SNAPSHOT</span>
                    </div>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                        {fleet.map((node) => (
                            <div 
                                key={node.id} 
                                title={`${node.name} - Version: ${node.version}`}
                                className={`aspect-square rounded-sm transition-all cursor-pointer hover:scale-110 ${
                                    node.status === 'ONLINE' ? 'bg-status-success shadow-sm shadow-emerald-500/50' : 'bg-surface-sidebar'
                                }`} 
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-surface-sidebar/50 border border-default rounded-2xl p-6 backdrop-blur-xl">
                    <h3 className="text-xl font-bold mb-6">Quantum Intelligence</h3>
                    <div className="space-y-4">
                        <InsightLine label="Fleet Entropy" value={`${quantum.fleetEntropy * 100}%`} />
                        <InsightLine label="Arbitrage Potential" value={quantum.arbitrageOpportunities} color="text-brand" />
                        <InsightLine label="OTA Staging" value={quantum.otaStagingCount} />
                        <hr className="border-default my-4" />
                        <div className="p-4 bg-action-primary/10 rounded-xl border border-focus/20">
                            <p className="text-xs text-brand font-mono">
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
    <div className="bg-surface-sidebar/80 border border-default p-6 rounded-2xl shadow-xl">
        <p className="text-muted text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl font-bold ${color || 'text-text-primary'}`}>{value}</h3>
            <span className="text-[10px] font-mono text-status-success">{trend}</span>
        </div>
    </div>
);

const InsightLine: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color }) => (
    <div className="flex justify-between items-center py-2 border-b border-default/50 last:border-0">
        <span className="text-muted text-sm">{label}</span>
        <span className={`font-mono font-bold ${color || 'text-text-primary'}`}>{value}</span>
    </div>
);
