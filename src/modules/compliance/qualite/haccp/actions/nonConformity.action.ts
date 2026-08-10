"use server";

import { requireSession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

export async function saveNonConformity(tenantId: string, payload: Record<string, unknown>) {
    try {
        await requireSession(tenantId);

        await NexusEventBus.emitDurable('haccp.nonconformity.saved', {
            v: 1,
            tenantId,
            payload,
            timestamp: Date.now(),
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function resolveNonConformity(tenantId: string, id: string, payload: Record<string, unknown>) {
    try {
        await requireSession(tenantId);

        await NexusEventBus.emitDurable('haccp.nonconformity.resolved', {
            v: 1,
            tenantId,
            id,
            payload,
            timestamp: Date.now(),
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}
