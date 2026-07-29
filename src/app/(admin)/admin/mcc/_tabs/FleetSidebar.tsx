'use client';
import dynamic from 'next/dynamic';
import { Cpu, Zap } from 'lucide-react';
import { StatusItem, SwitchboardItem, MCCWidgetSkeleton } from '@nexus/guards/admin/mcc';
import type { MCCHealthStatus } from '@/app/api/admin/mcc/health/route';
import type { SwitchboardState } from '@/shared/hooks/useSovereignSwitchboard';
import { useMCCLocale } from '../_i18n';

const PerformanceMonitor  = dynamic(() => import('@nexus/guards/admin/mcc/PerformanceMonitor').then(m => m.PerformanceMonitor), { loading: () => <MCCWidgetSkeleton /> });
const DeploymentEngine    = dynamic(() => import('@nexus/guards/admin/mcc/DeploymentEngine').then(m => m.DeploymentEngine), { loading: () => <MCCWidgetSkeleton /> });
const MCCInsights         = dynamic(() => import('@nexus/guards/admin/mcc/MCCInsights').then(m => m.MCCInsights), { loading: () => <MCCWidgetSkeleton /> });
const MCCAuditStream      = dynamic(() => import('@nexus/guards/admin/mcc/MCCAuditStream').then(m => m.MCCAuditStream), { loading: () => <MCCWidgetSkeleton /> });
const FleetTelemetryPanel = dynamic(() => import('@nexus/guards/admin/mcc/FleetTelemetryPanel').then(m => m.FleetTelemetryPanel), { loading: () => <MCCWidgetSkeleton /> });

interface FleetSidebarProps {
    health: MCCHealthStatus | null;
    switchboard: SwitchboardState;
    onToggleModule: (key: keyof SwitchboardState, reason: string) => void;
}

export function FleetSidebar({ health, switchboard, onToggleModule }: FleetSidebarProps) {
    const { t } = useMCCLocale();
    const s = t.status;
    const sb = t.sidebar;

    const provStatus = health
        ? health.provisioningEngine === 'ready' ? s.ready
        : health.provisioningEngine === 'degraded' ? s.degraded
        : s.offline
        : s.loading;

    const provColor = health
        ? health.provisioningEngine === 'ready' ? 'bg-status-success'
        : health.provisioningEngine === 'degraded' ? 'bg-action-primary'
        : 'bg-status-error'
        : 'bg-secondary';

    const axiomStatus = health
        ? health.axiomLogIngest === 'streaming' ? s.streaming
        : health.axiomLogIngest === 'degraded' ? s.degraded
        : s.offline
        : s.loading;

    const axiomColor = health
        ? health.axiomLogIngest === 'streaming' ? 'bg-status-success'
        : health.axiomLogIngest === 'degraded' ? 'bg-action-primary'
        : 'bg-status-error'
        : 'bg-secondary';

    const nf525Status = health
        ? health.nf525SealEngine === 'secured' ? s.secured
        : health.nf525SealEngine === 'degraded' ? s.degraded
        : s.offlineWarning
        : s.loading;

    const nf525Color = health
        ? health.nf525SealEngine === 'secured' ? 'bg-action-primary'
        : health.nf525SealEngine === 'degraded' ? 'bg-action-primary'
        : 'bg-status-error'
        : 'bg-secondary';

    const intelStatus = health
        ? health.fleetIntelligence === 'aggregating' ? s.aggregating
        : health.fleetIntelligence === 'degraded' ? s.degraded
        : s.offline
        : s.loading;

    const intelColor = health
        ? health.fleetIntelligence === 'aggregating' ? 'bg-action-primary'
        : health.fleetIntelligence === 'degraded' ? 'bg-action-primary'
        : 'bg-status-error'
        : 'bg-secondary';

    return (
        <>
            <PerformanceMonitor />
            <FleetTelemetryPanel />
            <DeploymentEngine />
            <MCCInsights />
            <MCCAuditStream />
            <div className="p-6 bg-surface-card backdrop-blur-md border border-border-subtle rounded-2xl mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <Cpu className="w-5 h-5 text-brand mt-0.5" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">{sb.coreStatus}</h3>
                </div>
                <div className="space-y-4">
                    <StatusItem label={sb.provisioningEngine} status={provStatus} color={provColor} />
                    <StatusItem label={sb.axiomLogIngest}     status={axiomStatus} color={axiomColor} />
                    <StatusItem label={sb.nf525SealEngine}    status={nf525Status} color={nf525Color} />
                    <StatusItem label={sb.fleetIntelligence}  status={intelStatus} color={intelColor} />
                </div>
            </div>
            <div className="p-6 bg-surface-card backdrop-blur-md border border-focus/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Zap className="w-5 h-5 text-brand mt-0.5" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand">{sb.switchboard}</h3>
                </div>
                <div className="space-y-4">
                    <SwitchboardItem label={sb.telemetrySentinel} active={switchboard.telemetryActive}       onToggle={() => onToggleModule('telemetryActive', 'MCC: bascule télémétrie')} />
                    <SwitchboardItem label={sb.samAutomations}    active={switchboard.samActive}             onToggle={() => onToggleModule('samActive', 'MCC: bascule SAM automations')} />
                    <SwitchboardItem label={sb.nexusSyncEngine}   active={switchboard.nexusSyncActive}       onToggle={() => onToggleModule('nexusSyncActive', 'MCC: bascule synchronisation Nexus')} />
                    <SwitchboardItem label={sb.clientInterface}   active={switchboard.clientInterfaceActive} onToggle={() => onToggleModule('clientInterfaceActive', 'MCC: bascule interface client')} />
                </div>
            </div>
        </>
    );
}
