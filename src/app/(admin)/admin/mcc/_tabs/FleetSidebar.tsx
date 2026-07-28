'use client';
import dynamic from 'next/dynamic';
import { Cpu, Zap } from 'lucide-react';
import { StatusItem, SwitchboardItem, MCCWidgetSkeleton } from '@nexus/guards/admin/mcc';
import type { MCCHealthStatus } from '@/app/api/admin/mcc/health/route';
import type { SwitchboardState } from '@/shared/hooks/useSovereignSwitchboard';

const PerformanceMonitor = dynamic(() => import('@nexus/guards/admin/mcc/PerformanceMonitor').then(m => m.PerformanceMonitor), { loading: () => <MCCWidgetSkeleton /> });
const DeploymentEngine   = dynamic(() => import('@nexus/guards/admin/mcc/DeploymentEngine').then(m => m.DeploymentEngine), { loading: () => <MCCWidgetSkeleton /> });
const MCCInsights        = dynamic(() => import('@nexus/guards/admin/mcc/MCCInsights').then(m => m.MCCInsights), { loading: () => <MCCWidgetSkeleton /> });
const MCCAuditStream     = dynamic(() => import('@nexus/guards/admin/mcc/MCCAuditStream').then(m => m.MCCAuditStream), { loading: () => <MCCWidgetSkeleton /> });

interface FleetSidebarProps {
    health: MCCHealthStatus | null;
    switchboard: SwitchboardState;
    onToggleModule: (key: keyof SwitchboardState, reason: string) => void;
}

export function FleetSidebar({ health, switchboard, onToggleModule }: FleetSidebarProps) {
    return (
        <>
            <PerformanceMonitor />
            <DeploymentEngine />
            <MCCInsights />
            <MCCAuditStream />
            <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <Cpu className="w-5 h-5 text-brand mt-0.5" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">MCC Core Status</h3>
                </div>
                <div className="space-y-4">
                    <StatusItem label="Provisioning Engine" status={health ? (health.provisioningEngine === 'ready' ? 'Ready' : health.provisioningEngine === 'degraded' ? 'Dégradé' : 'Offline') : '…'} color={health ? (health.provisioningEngine === 'ready' ? 'bg-status-success' : health.provisioningEngine === 'degraded' ? 'bg-action-primary' : 'bg-status-error') : 'bg-secondary'} />
                    <StatusItem label="Axiom Log Ingest"    status={health ? (health.axiomLogIngest === 'streaming' ? 'Streaming' : health.axiomLogIngest === 'degraded' ? 'Dégradé' : 'Offline') : '…'} color={health ? (health.axiomLogIngest === 'streaming' ? 'bg-status-success' : health.axiomLogIngest === 'degraded' ? 'bg-action-primary' : 'bg-status-error') : 'bg-secondary'} />
                    <StatusItem label="NF525 Seal Engine"   status={health ? (health.nf525SealEngine === 'secured' ? 'Secured' : health.nf525SealEngine === 'degraded' ? 'Dégradé' : 'Offline ⚠') : '…'} color={health ? (health.nf525SealEngine === 'secured' ? 'bg-action-primary' : health.nf525SealEngine === 'degraded' ? 'bg-action-primary' : 'bg-status-error') : 'bg-secondary'} />
                    <StatusItem label="Fleet Intelligence"  status={health ? (health.fleetIntelligence === 'aggregating' ? 'Aggregating' : health.fleetIntelligence === 'degraded' ? 'Dégradé' : 'Offline') : '…'} color={health ? (health.fleetIntelligence === 'aggregating' ? 'bg-action-primary' : health.fleetIntelligence === 'degraded' ? 'bg-action-primary' : 'bg-status-error') : 'bg-secondary'} />
                </div>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-md border border-focus/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Zap className="w-5 h-5 text-brand mt-0.5" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand">Sovereign Switchboard</h3>
                </div>
                <div className="space-y-4">
                    <SwitchboardItem label="Telemetry & Sentinel" active={switchboard.telemetryActive}       onToggle={() => onToggleModule('telemetryActive', 'Manual MCC override')} />
                    <SwitchboardItem label="SAM Automations"      active={switchboard.samActive}             onToggle={() => onToggleModule('samActive', 'Manual MCC override')} />
                    <SwitchboardItem label="Nexus Sync Engine"    active={switchboard.nexusSyncActive}       onToggle={() => onToggleModule('nexusSyncActive', 'Manual MCC override')} />
                    <SwitchboardItem label="Client Interface"     active={switchboard.clientInterfaceActive} onToggle={() => onToggleModule('clientInterfaceActive', 'Manual MCC override')} />
                </div>
            </div>
        </>
    );
}
