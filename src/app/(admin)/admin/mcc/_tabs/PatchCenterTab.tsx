'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc';

const TenantOverridePanel  = dynamic(() => import('@nexus/guards/admin/mcc/TenantOverridePanel').then(m => m.TenantOverridePanel), { loading: () => <MCCWidgetSkeleton /> });
const FleetUpgradePanel    = dynamic(() => import('@nexus/guards/admin/mcc/FleetUpgradePanel').then(m => m.FleetUpgradePanel), { loading: () => <MCCWidgetSkeleton /> });
const SupportDraftsPanel   = dynamic(() => import('@nexus/guards/admin/mcc/SupportDraftsPanel').then(m => m.SupportDraftsPanel), { loading: () => <MCCWidgetSkeleton /> });
const TenantChangelogPanel = dynamic(() => import('@nexus/guards/admin/mcc/TenantChangelogPanel').then(m => m.TenantChangelogPanel), { loading: () => <MCCWidgetSkeleton /> });

export function PatchCenterTab() {
    return (
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
    );
}
