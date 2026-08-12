"use client";

import { useEffect } from "react";
import { Sentry, configureTenantScope } from "@/lib/sentry";
import type { PlatformVertical } from "@/lib/sentry";
import { useAtomValue } from "jotai";
import { tenantIdAtom, tenantVariantAtom } from "@/store/pillars/sovereign";
import { useFinanceReflex } from "@modules/finance";
import { logger } from "@/lib/logger";

export function NexusPulseOrchestrator(): null {
    const tenantId = useAtomValue(tenantIdAtom);
    const vertical = useAtomValue(tenantVariantAtom) as PlatformVertical;

    useFinanceReflex();

    useEffect(() => {
        if (!tenantId) return;

        configureTenantScope({
            tenantId,
            vertical,
            appMode: (process.env.NEXT_PUBLIC_APP_MODE as 'tenant' | 'mcc') ?? 'tenant',
        });

        logger.info(`[PulseOrchestrator] System Pulse Activated for tenant: ${tenantId} (${vertical})`);

        Sentry.addBreadcrumb({
            category: 'pulse',
            message: `Session initialized: ${tenantId} [${vertical}]`,
            level: 'info'
        });
    }, [tenantId, vertical]);

    return null;
}
