'use client';

import { useCallback } from 'react';
import { auditService } from './AuditService';
import type { AuditAction } from '@/modules/compliance/domain/schemas/audit';

interface OverrideContext {
    tenantId: string;
    actorId: string;
    actorRole: string;
}

export function useAuditOverride(ctx: OverrideContext) {
    const recordOverride = useCallback(
        (action: AuditAction, collection: string, entityId?: string, metadata?: Record<string, unknown>) => {
            auditService.record({
                tenantId: ctx.tenantId,
                actorId: ctx.actorId,
                actorRole: ctx.actorRole,
                action,
                collection,
                entityId,
                metadata,
            }).catch(() => {});
        },
        [ctx.tenantId, ctx.actorId, ctx.actorRole]
    );

    return { recordOverride };
}
