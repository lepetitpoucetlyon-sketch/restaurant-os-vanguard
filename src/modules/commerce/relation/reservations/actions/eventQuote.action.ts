"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const EventQuotePayloadSchema = z.object({
    title: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z.string().optional(),
    amountInMicrounits: z.number().int().min(0).optional(),
    totals: z.object({
        totalHTInMicrounits: z.number().int().min(0).optional(),
        totalTTCInMicrounits: z.number().int().min(0).optional(),
        totalTaxInMicrounits: z.number().int().min(0).optional(),
    }).optional(),
    items: z.array(z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        quantity: z.number().int().min(1).optional(),
        priceInMicrounits: z.number().int().min(0).optional(),
    })).optional(),
}).passthrough();

export type EventQuotePayload = z.infer<typeof EventQuotePayloadSchema>;

export const saveEventQuoteDraft = createSafeAction(
    z.tuple([z.string().min(1, 'quoteId requis'), EventQuotePayloadSchema]),
    { page: "reservations", action: "create_group_quote" },
    async (tenantId, quoteId: string, payload: EventQuotePayload) => {
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
