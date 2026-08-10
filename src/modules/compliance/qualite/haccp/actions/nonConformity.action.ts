"use server";

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

export const saveNonConformity = createSafeAction(
    z.tuple([z.unknown()]),
    { page: "haccp", action: "report_nonconformity" },
    async (tenantId, payload: Record<string, unknown>) => {
        try {
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
);

export const resolveNonConformity = createSafeAction(
    z.tuple([z.string(), z.unknown()]),
    { page: "haccp", action: "close_nonconformity" },
    async (tenantId, id: string, payload: Record<string, unknown>) => {
        try {
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
);
