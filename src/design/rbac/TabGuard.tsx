import React from "react";
import { useTabAccess } from "@/kernel/hooks/useTabAccess";
import { PageKey } from "@nexus/contracts/permissions.types";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/kernel/providers/NexusCoreContext";

interface TabGuardProps {
    pageKey: PageKey | string;
    tabKey: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function TabGuard({ pageKey, tabKey, children, fallback = null }: TabGuardProps) {
    const { isAuthLoading } = useAuth();
    const hasAccess = useTabAccess(pageKey, tabKey);

    if (isAuthLoading) {
        return (
            <div className="flex w-full items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
