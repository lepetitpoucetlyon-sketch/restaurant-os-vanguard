"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useAtomValue } from "jotai";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { useFinanceReflex } from "@modules/finance";
import { logger } from "@/lib/logger";

/**
 * 🛰️ NexusPulseOrchestrator - Grade X+++
 * Central point where all cross-domain reflexes are initialized and monitored.
 */
export function NexusPulseOrchestrator(): null {
    const tenantId = useAtomValue(tenantIdAtom);

    // 🧬 DOMAIN REFLEXES
    useFinanceReflex();

    useEffect(() => {
        // 🛰️ SENTRY HEARTBEAT (Grade X)
        Sentry.setTag("nexus.grade", "X+++");
        Sentry.setTag("tenant_id", tenantId as string);

        logger.info(`[PulseOrchestrator] System Pulse Activated for tenant: ${tenantId}`);

        // 🔬 MOLECULAR SCANNER HEARTBEAT
        Sentry.addBreadcrumb({
            category: 'pulse',
            message: 'Molecular scanner cycle check',
            level: 'info'
        });
    }, [tenantId]);

    return null;
}
