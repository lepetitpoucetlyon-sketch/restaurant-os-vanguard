'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc';

const CertificationCenter = dynamic(() => import('@nexus/guards/admin/mcc/CertificationCenter').then(m => m.CertificationCenter), { loading: () => <MCCWidgetSkeleton /> });
const FiscalChainExplorer = dynamic(() => import('@nexus/guards/admin/mcc/FiscalChainExplorer').then(m => m.FiscalChainExplorer), { loading: () => <MCCWidgetSkeleton /> });
const TaxAuditPanel       = dynamic(() => import('@nexus/guards/admin/mcc/TaxAuditPanel').then(m => m.TaxAuditPanel), { loading: () => <MCCWidgetSkeleton /> });
const TrustedDevicePanel  = dynamic(() => import('@nexus/guards/admin/mcc/TrustedDevicePanel').then(m => m.TrustedDevicePanel), { loading: () => <MCCWidgetSkeleton /> });

export function ComplianceTab() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 xl:col-span-8"><CertificationCenter /></div>
                <div className="col-span-12 xl:col-span-4"><FiscalChainExplorer /></div>
            </div>
            <TaxAuditPanel />
            <TrustedDevicePanel />
        </div>
    );
}
