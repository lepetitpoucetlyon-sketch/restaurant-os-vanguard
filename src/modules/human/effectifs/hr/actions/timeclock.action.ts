"use server";

import { verifySession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toError } from '@/lib/toError';
import { processTimeclockAction, ClockAction, TimeclockPayload } from '../services/timeclock.domain';
import { SharedKernel } from '@/lib/shared-kernel';

export async function submitTimeclockAction(action: ClockAction, data: TimeclockPayload) {
    try {
        await verifySession(data.tenantId);

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
