// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Nexus } from "@/lib/nexus/NexusAdapter";

export function useStaffAudit(limitCount = 50) {
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = Nexus.adapter.onSnapshot(
            'audit_logs',
            (data: any[]) => {
                setAuditLogs(data);
                setLoading(false);
            },
            {
                orderBy: { field: 'timestamp', direction: 'desc' },
                limit: limitCount
            }
        );
        return () => unsubscribe();
    }, [limitCount]);

    return { auditLogs, loading };
}
