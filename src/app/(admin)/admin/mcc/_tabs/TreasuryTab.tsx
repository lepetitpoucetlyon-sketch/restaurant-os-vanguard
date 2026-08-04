'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '../components';

const MCCTreasury       = dynamic(() => import('../components/MCCTreasury').then(m => m.MCCTreasury), { loading: () => <MCCWidgetSkeleton /> });
const TenantBillingPanel = dynamic(() => import('../components/TenantBillingPanel').then(m => m.TenantBillingPanel), { loading: () => <MCCWidgetSkeleton /> });
const ResellerPortal     = dynamic(() => import('../components/ResellerPortal').then(m => m.ResellerPortal), { loading: () => <MCCWidgetSkeleton /> });

export function TreasuryTab() {
    return (
        <div className="space-y-8">
            <MCCTreasury />
            <TenantBillingPanel />
            <ResellerPortal />
        </div>
    );
}
