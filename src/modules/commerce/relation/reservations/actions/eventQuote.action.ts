"use server";

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/shared/nexus/actions/actionWrapper";
import { z } from "zod";

export const saveEventQuoteDraft = createSafeAction(
    z.tuple([z.string(), z.custom<unknown>(() => true)]),
    { page: "reservations", action: "create_group_quote" },
    async (tenantId, quoteId: string, payload: Record<string, unknown>) => {
        try {
            await NexusEventBus.emitDurable('eventQuote.draft.saved', {
                v: 1,
                tenantId,
                quoteId,
                payload,
                timestamp: Date.now(),
            });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);
