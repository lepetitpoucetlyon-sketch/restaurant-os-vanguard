'use client';
import dynamic from 'next/dynamic';
import { LayoutGrid, TrendingUp, Activity, ShieldCheck, Plus } from 'lucide-react';
import { StatCard, TenantUsersPanel, MCCWidgetSkeleton } from '@nexus/guards/admin/mcc';
import type { EmpireInstance, EmpireGlobalMetrics } from '@nexus/contracts';
import { useMCCLocale } from '../_i18n';

const FleetCommandTable    = dynamic(() => import('@nexus/guards/admin/mcc/FleetCommandTable').then(m => m.FleetCommandTable), { loading: () => <MCCWidgetSkeleton /> });
const FleetDeviceInventory = dynamic(() => import('@nexus/guards/admin/mcc/FleetDeviceInventory').then(m => m.FleetDeviceInventory), { loading: () => <MCCWidgetSkeleton /> });

interface FleetTabProps {
    instances: EmpireInstance[];
    globalMetrics: EmpireGlobalMetrics | null;
    onShowCloneModal: () => void;
}

export function FleetTab({ instances, globalMetrics, onShowCloneModal }: FleetTabProps) {
    const { t } = useMCCLocale();
    const f = t.fleet;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label={f.totalInstances}   value={instances.length.toString()} icon={<LayoutGrid className="text-brand" />} trend={f.trendCapacity} />
                <StatCard label={f.globalRevenue}    value={`€${((globalMetrics?.fleetTotalRevenue || 0) / 100).toLocaleString()}`} icon={<TrendingUp className="text-status-success" />} trend={f.trendRevenue} />
                <StatCard label={f.fleetHealth}      value={`${Math.round(globalMetrics?.averageHealthScore || 100)}%`} icon={<Activity className="text-brand" />} trend={f.trendHealth} />
                <StatCard label={f.globalCompliance} value={`${globalMetrics?.averageComplianceScore?.toFixed(1) || '100'}%`} icon={<ShieldCheck className="text-brand" />} trend={f.trendCompliance} />
            </div>
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-secondary">{f.tacticalOverview}</h3>
                <button onClick={onShowCloneModal} className="bg-action-primary text-text-primary font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest text-[10px]">
                    <Plus className="w-4 h-4" /> {f.newClone}
                </button>
            </div>
            <FleetCommandTable />
            {instances.length > 0 && <TenantUsersPanel instance={instances[0]} />}
            <FleetDeviceInventory instances={instances.map(i => ({ tenantId: i.id, name: i.name }))} />
        </div>
    );
}
