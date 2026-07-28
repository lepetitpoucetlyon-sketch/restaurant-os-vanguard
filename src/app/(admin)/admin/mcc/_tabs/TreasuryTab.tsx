'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc';

const MCCTreasury       = dynamic(() => import('@nexus/guards/admin/mcc/MCCTreasury').then(m => m.MCCTreasury), { loading: () => <MCCWidgetSkeleton /> });
const TenantBillingPanel = dynamic(() => import('@nexus/guards/admin/mcc/TenantBillingPanel').then(m => m.TenantBillingPanel), { loading: () => <MCCWidgetSkeleton /> });
const ResellerPortal     = dynamic(() => import('@nexus/guards/admin/mcc/ResellerPortal').then(m => m.ResellerPortal), { loading: () => <MCCWidgetSkeleton /> });

export function TreasuryTab() {
    return (
        <div className="space-y-8">
            <MCCTreasury />
            <TenantBillingPanel />
            <ResellerPortal />
        </div>
    );
}
