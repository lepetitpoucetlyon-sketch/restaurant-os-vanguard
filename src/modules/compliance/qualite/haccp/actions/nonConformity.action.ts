"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const NonConformityPayloadSchema = z.object({
    id: z.string().min(1).optional(),
    title: z.string().min(1, 'titre requis'),
    description: z.string().optional(),
    severity: z.enum(['minor', 'major', 'critical']).default('minor'),
    category: z.string().optional(),
    reportedBy: z.string().optional(),
    correctiveAction: z.string().optional(),
}).passthrough();

const ResolveNonConformityPayloadSchema = z.object({
    resolutionNotes: z.string().optional(),
    resolvedBy: z.string().optional(),
    resolvedAt: z.number().optional(),
}).passthrough();

export type NonConformityPayload = z.infer<typeof NonConformityPayloadSchema>;
export type ResolveNonConformityPayload = z.infer<typeof ResolveNonConformityPayloadSchema>;

export const saveNonConformity = createSafeAction(
    z.tuple([NonConformityPayloadSchema]),
    { page: "haccp", action: "report_nonconformity" },
    async (tenantId, payload: NonConformityPayload) => {
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
    z.tuple([z.string().min(1, 'id requis'), ResolveNonConformityPayloadSchema]),
    { page: "haccp", action: "close_nonconformity" },
    async (tenantId, id: string, payload: ResolveNonConformityPayload) => {
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
