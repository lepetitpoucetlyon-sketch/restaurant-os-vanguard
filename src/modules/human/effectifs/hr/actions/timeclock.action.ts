"use server";

import { requireSession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toError } from '@/lib/toError';
import { processTimeclockAction, ClockAction, TimeclockPayload } from '../services/timeclock.domain';
import { SharedKernel } from '@/lib/shared-kernel';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

export const submitTimeclockAction = createSafeAction(
    z.tuple([z.string(), z.unknown()]),
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
