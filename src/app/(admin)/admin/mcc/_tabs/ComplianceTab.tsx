'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '../components';
import { useFleet } from '@/shared/contexts/FleetContext';

const CertificationCenter = dynamic(() => import('../components/CertificationCenter').then(m => m.CertificationCenter), { loading: () => <MCCWidgetSkeleton /> });
const FiscalChainExplorer = dynamic(() => import('../components/FiscalChainExplorer').then(m => m.FiscalChainExplorer), { loading: () => <MCCWidgetSkeleton /> });
const TaxAuditPanel       = dynamic(() => import('../components/TaxAuditPanel').then(m => m.TaxAuditPanel), { loading: () => <MCCWidgetSkeleton /> });
const TrustedDevicePanel      = dynamic(() => import('../components/TrustedDevicePanel').then(m => m.TrustedDevicePanel), { loading: () => <MCCWidgetSkeleton /> });
const FiscalArchiveExportPanel  = dynamic(() => import('../components/FiscalArchiveExportPanel').then(m => m.FiscalArchiveExportPanel), { loading: () => <MCCWidgetSkeleton /> });

export function ComplianceTab() {
    const { selectedInstanceId } = useFleet() as { selectedInstanceId: string | null };

    return (
        <div className="space-y-8">
            <FiscalArchiveExportPanel />
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 xl:col-span-8"><CertificationCenter /></div>
                <div className="col-span-12 xl:col-span-4">
                    <FiscalChainExplorer instanceId={selectedInstanceId ?? undefined} />
                </div>
            </div>
            <TaxAuditPanel />
            <TrustedDevicePanel />
        </div>
    );
}
