"use client";

import dynamic from 'next/dynamic';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

const FranchiseDashboard = dynamic(
    () => import('@/modules/commerce/relation/franchise/components/FranchiseDashboard').then(m => m.FranchiseDashboard),
    {
        ssr: false,
        loading: () => (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement du réseau de franchise...</div>
        )
    }
);

function FranchisePage() {
    return <FranchiseDashboard />;
}

export default withPageGuard(FranchisePage, 'franchise');
