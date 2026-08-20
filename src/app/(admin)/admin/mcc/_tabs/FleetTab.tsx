'use client';
import dynamic from 'next/dynamic';
import { LayoutGrid, TrendingUp, Activity, ShieldCheck, Plus, FlaskConical, Loader2 } from 'lucide-react';
import { TenantUsersPanel, MCCWidgetSkeleton, VerticalActivePanel, HealthHistorySparkline, HardwareHealthGrid } from '../components';
import { StatCard } from '@/shared/components/ui';
import type { EmpireInstance, EmpireGlobalMetrics } from '@nexus/contracts';
import { useMCCLocale } from '../_i18n';
import { useState } from 'react';
import { authedFetch } from '@/lib/client/authedFetch';
import { toast } from 'sonner';
import { useFleet } from '@/shared/contexts/FleetContext';

const FleetCommandTable    = dynamic(() => import('../components/FleetCommandTable').then(m => m.FleetCommandTable), { loading: () => <MCCWidgetSkeleton /> });
const FleetDeviceInventory = dynamic(() => import('../components/FleetDeviceInventory').then(m => m.FleetDeviceInventory), { loading: () => <MCCWidgetSkeleton /> });
const MCCInsights          = dynamic(() => import('../components/MCCInsights').then(m => m.MCCInsights), { loading: () => null });
const TenantHealthPanel    = dynamic(() => import('../components/TenantHealthPanel').then(m => m.TenantHealthPanel), { loading: () => <MCCWidgetSkeleton /> });

interface FleetTabProps {
    instances: EmpireInstance[];
    globalMetrics: EmpireGlobalMetrics | null;
    onShowCloneModal: () => void;
}

export function FleetTab({ instances, globalMetrics, onShowCloneModal }: FleetTabProps) {
    const { t } = useMCCLocale();
    const f = t.fleet;
    const [seeding, setSeeding] = useState(false);
    const { selectedInstanceId } = useFleet();
    const activeInstance = instances.find(i => i.id === selectedInstanceId) ?? instances[0] ?? null;

    const activateDemo = async () => {
        setSeeding(true);
        try {
            const res = await authedFetch('/api/admin/fleet/seed-demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            if (!res.ok) throw new Error('seed failed');
            const data = await res.json() as { tenantId: string; name: string };
            toast.success(`Instance démo "${data.name}" activée — cliquer sur Sync Globale pour l'afficher`);
        } catch {
            toast.error('Impossible d\'activer la démo');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label={f.totalInstances}   value={instances.length.toString()} icon={<LayoutGrid className="text-brand" />} trend={f.trendCapacity} />
                <StatCard label={f.globalRevenue}    value={`€${(globalMetrics?.fleetTotalRevenue || 0).toLocaleString()}`} icon={<TrendingUp className="text-status-success" />} trend={f.trendRevenue} />
                <StatCard label={f.fleetHealth}      value={globalMetrics ? `${Math.round(globalMetrics.averageHealthScore)}%` : '—'} icon={<Activity className="text-brand" />} trend={f.trendHealth} />
                <StatCard label={f.globalCompliance} value={globalMetrics ? `${globalMetrics.averageComplianceScore?.toFixed(1) ?? '0'}%` : '—'} icon={<ShieldCheck className="text-brand" />} trend={f.trendCompliance} />
            </div>

            {instances.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 py-12 border border-dashed border-border-subtle rounded-2xl bg-surface-card/50">
                    <FlaskConical className="w-10 h-10 text-brand/40" />
                    <div className="text-center">
                        <p className="text-sm font-bold text-text-secondary mb-1">Aucune instance dans la flotte</p>
                        <p className="text-xs text-secondary">Active l'instance démo pour tester toutes les fonctionnalités du MCC</p>
                    </div>
                    <button
                        onClick={activateDemo}
                        disabled={seeding}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                        Activer l&apos;instance démo
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-secondary">{f.tacticalOverview}</h3>
                <button onClick={onShowCloneModal} className="bg-action-primary text-text-primary font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest text-[10px]">
                    <Plus className="w-4 h-4" /> {f.newClone}
                </button>
            </div>
            <MCCInsights />
            <TenantHealthPanel />
            <FleetCommandTable />
            {activeInstance && <TenantUsersPanel instance={activeInstance} />}
            {activeInstance && (
                <div className="mt-2 space-y-6">
                    <HardwareHealthGrid tenantId={activeInstance.key} />
                    <HealthHistorySparkline tenantId={activeInstance.key} />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-3">Vertical actif</p>
                        <VerticalActivePanel tenantId={activeInstance.key} />
                    </div>
                </div>
            )}
            <FleetDeviceInventory instances={instances.map(i => ({ tenantId: i.id, name: i.name }))} />
        </div>
    );
}
