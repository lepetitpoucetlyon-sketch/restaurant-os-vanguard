"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const CleaningTaskRecordSchema = z.object({
    id: z.string().min(1),
    taskId: z.string().optional(),
    zoneId: z.string().optional(),
    operatorId: z.string().min(1),
    signedAt: z.number().optional(),
    notes: z.string().optional(),
}).passthrough();

export type CleaningTaskRecord = z.infer<typeof CleaningTaskRecordSchema>;

export const signCleaningTaskAction = createSafeAction(
    z.tuple([CleaningTaskRecordSchema]),
    { page: "haccp", action: "validate_checklist" },
    async (tenantId, record: CleaningTaskRecord) => {
        try {
            await NexusEventBus.emitDurable('haccp.cleaning.completed', { tenantId, id: record.id, data: record });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const logCoolingCycleAction = createSafeAction(
    z.tuple([
        z.string().min(1, 'batchId requis'),
        z.string().min(1, 'productId requis'),
        z.string().min(1, 'productName requis'),
        z.number().min(-50).max(200, 'température invalide'),
        z.number().min(-50).max(200, 'température invalide'),
        z.number().min(0).max(1440, 'durée invalide'),
        z.string().min(1, 'operatorId requis')
    ]),
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
