"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toError } from '@/lib/toError';
import { processTimeclockAction, ClockAction, TimeclockPayload } from '../services/timeclock.domain';
import { SharedKernel } from '@/lib/shared-kernel';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const ClockActionSchema = z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]);
const TimeclockPayloadSchema = z.object({
    userId: z.string().min(1, 'userId requis'),
    userName: z.string().min(1, 'userName requis'),
    tenantId: z.string().min(1),
    terminalId: z.string().min(1, 'terminalId requis'),
    timestamp: z.string().min(1),
}).passthrough();

export const submitTimeclockAction = createSafeAction(
    z.tuple([ClockActionSchema, TimeclockPayloadSchema]),
    { page: "timeclock", action: "clock_self" },
    async (tenantId, action: ClockAction, data: TimeclockPayload) => {
        try {
            const result = processTimeclockAction(action, data, () => SharedKernel.generateId('sc'));

            if (result.type === 'EVENT') {
                await NexusEventBus.emitDurable(result.eventName as any, result.payload);
            } else if (result.type === 'DB_WRITE') {
                await Nexus.adapter.set(result.path, result.payload);
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);
