"use client";

import dynamic from 'next/dynamic';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

const FranchiseDashboard = dynamic(
    () => import('@/modules/commerce/franchise/components/FranchiseDashboard').then(m => m.FranchiseDashboard),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                    Chargement du Réseau Multi-Sites...
                </p>
            </div>
        )
    }
);

function FranchisePage() {
    return <FranchiseDashboard />;
}

export default withPageGuard(FranchisePage, 'franchise');
