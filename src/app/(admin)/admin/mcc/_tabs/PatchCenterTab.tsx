'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '../components';

const TenantOverridePanel  = dynamic(() => import('../components/TenantOverridePanel').then(m => m.TenantOverridePanel), { loading: () => <MCCWidgetSkeleton /> });
const FleetUpgradePanel    = dynamic(() => import('../components/FleetUpgradePanel').then(m => m.FleetUpgradePanel), { loading: () => <MCCWidgetSkeleton /> });
const SupportDraftsPanel   = dynamic(() => import('../components/SupportDraftsPanel').then(m => m.SupportDraftsPanel), { loading: () => <MCCWidgetSkeleton /> });
const TenantChangelogPanel = dynamic(() => import('../components/TenantChangelogPanel').then(m => m.TenantChangelogPanel), { loading: () => <MCCWidgetSkeleton /> });
const DisasterRecoveryPanel = dynamic(() => import('../components/DisasterRecoveryPanel').then(m => m.DisasterRecoveryPanel), { loading: () => <MCCWidgetSkeleton /> });

export function PatchCenterTab() {
    return (
        <div className="space-y-8">
            <DisasterRecoveryPanel />
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 xl:col-span-5 space-y-6">
                    <TenantOverridePanel />
                    <FleetUpgradePanel />
                </div>
                <div className="col-span-12 xl:col-span-7 space-y-6">
                    <SupportDraftsPanel />
                    <TenantChangelogPanel />
                </div>
            </div>
        </div>
    );
}
