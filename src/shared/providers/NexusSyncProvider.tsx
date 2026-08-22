"use client";

import React, { useEffect } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { NexusSyncService } from '@/lib/NexusSyncService';
import { TelemetryHook } from '@/lib/telemetry';
import { GlobalRegistryService } from '@/lib/GlobalRegistryService';
import { useTaskContext } from '@/lib/icm/useTaskContext';
import { tenantIdAtom } from '@/store/pillars/sovereign';
import { isMCCMode } from '@/config/instance';
import { logger } from '@/lib/logger';

/**
 * 🛰️ NexusSyncProvider — Platform-wide synchronization lifecycle provider.
 * Manages atomic background sync, outbox replaying, and telemetry for the active tenant.
 */
export function NexusSyncProvider({ children }: { children: React.ReactNode }) {
    const tenantId = useAtomValue(tenantIdAtom) as string;
    const store = useStore();
    const taskContext = useTaskContext();

    useEffect(() => {
        if (isMCCMode()) {
            logger.info('[NexusSyncProvider] MCC mode — tenant sync engines disabled');
            return;
        }
        if (!tenantId) return;

        NexusSyncService.init(tenantId, taskContext);
        TelemetryHook.emit('CORE', 'module_accessed', { context: 'NexusSyncProvider', tenantId, task: taskContext.taskId });
        const purgeInterval = setInterval(() => GlobalRegistryService.purgeInactive(store), 120000);

        return () => {
            NexusSyncService.stopAll();
            clearInterval(purgeInterval);
        };
    }, [tenantId, taskContext, store]);

    return <>{children}</>;
}
