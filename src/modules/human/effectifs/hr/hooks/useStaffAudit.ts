"use client";

import { useState, useEffect } from "react";
import { Nexus } from "@/lib/nexus/NexusAdapter";

import { AuditLog } from "@nexus/contracts";

export function useStaffAudit(limitCount = 50) {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = Nexus.adapter.onSnapshot(
            'audit_logs',
            (data: AuditLog[]) => {
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
