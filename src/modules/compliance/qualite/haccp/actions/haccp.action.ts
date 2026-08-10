"use server";

import { verifySession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

export async function signCleaningTaskAction(tenantId: string, record: any) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('haccp.cleaning.completed', { tenantId, id: record.id, data: record });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function logCoolingCycleAction(
    tenantId: string,
    batchId: string,
    productId: string,
    productName: string,
    startTempCelsius: number,
    endTempCelsius: number,
    durationMinutes: number,
    operatorId: string
) {
    try {
        await verifySession(tenantId);
        // Reglementation HCR : refroidissement de +63°C a +10°C en moins de 120 min (2h)
        const compliant = startTempCelsius >= 63 && endTempCelsius <= 10 && durationMinutes <= 120;
        await NexusEventBus.emitDurable('haccp.cooling_cycle_logged', {
            v: 1,
            tenantId,
            batchId,
            productId,
            productName,
            startTempCelsius,
            endTempCelsius,
            durationMinutes,
            operatorId,
            compliant,
            loggedAt: Date.now(),
        });
        return { success: true, compliant };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

