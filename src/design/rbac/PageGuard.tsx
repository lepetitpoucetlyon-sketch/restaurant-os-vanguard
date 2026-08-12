import React from "react";
import { usePageAccess } from "@/shared/hooks/usePageAccess";
import { PageKey } from "@nexus/contracts/permissions.types";
import { AccessDenied } from "./AccessDenied";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/kernel/providers/NexusCoreProvider";

interface PageGuardProps {
    pageKey: PageKey | string;
    children: React.ReactNode;
}

export function PageGuard({ pageKey, children }: PageGuardProps) {
    const { isAuthLoading } = useAuth();
    const hasAccess = usePageAccess(pageKey);

    if (isAuthLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-bg-primary">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (!hasAccess) {
        return <AccessDenied />;
    }

    return <>{children}</>;
}

export function withPageGuard<P extends object>(Component: React.ComponentType<P>, pageKey: PageKey | string) {
    return function WithPageGuardWrapper(props: P) {
        return (
            <PageGuard pageKey={pageKey}>
                <Component {...props} />
            </PageGuard>
        );
    };
}
