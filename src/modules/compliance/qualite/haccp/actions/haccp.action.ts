"use server";

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/shared/nexus/actions/actionWrapper";
import { z } from "zod";

export const signCleaningTaskAction = createSafeAction(
    z.tuple([z.custom<unknown>(() => true)]),
    { page: "haccp", action: "validate_checklist" },
    async (tenantId, record: any) => {
        try {
            await NexusEventBus.emitDurable('haccp.cleaning.completed', { tenantId, id: record.id, data: record });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const logCoolingCycleAction = createSafeAction(
    z.tuple([z.string(), z.string(), z.string(), z.number(), z.number(), z.number(), z.string()]),
    { page: "haccp", action: "record_temperature" },
    async (
        tenantId,
        batchId: string,
        productId: string,
        productName: string,
        startTempCelsius: number,
        endTempCelsius: number,
        durationMinutes: number,
        operatorId: string
    ) => {
        try {
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
);
