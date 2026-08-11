"use server";

import { Nexus } from "@/lib/nexus/NexusAdapter";
import { IdGenerator } from "@/lib/utils/IdGenerator";
import { toError } from "@/lib/toError";
import type { CashDrawerSession } from "../types/cashdrawer.types";

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const CashDrawerSessionSchema = z.object({
    id: z.string().min(1),
    openedAt: z.string(),
    openingInMicrounits: z.number().int().min(0),
    collectedInMicrounits: z.number().int(),
    changeGivenInMicrounits: z.number().int(),
    userId: z.string().min(1),
}).passthrough();

export const openCashDrawerAction = createSafeAction(
    z.tuple([
        z.string().min(1, 'userId requis'),
        z.number().int('montant en microunits requis').min(0, 'montant positif requis')
    ]),
    { page: "pos", action: "open_drawer" },
    async (tenantId, userId: string, openingInMicrounits: number) => {
        try {
            const sessionId = IdGenerator.generateWithPrefix("cds");
            const newSession: CashDrawerSession = {
                id: sessionId,
                openedAt: new Date().toISOString(),
                openingInMicrounits,
                collectedInMicrounits: 0,
                changeGivenInMicrounits: 0,
                userId,
            };

            const path = `tenants/${tenantId}/cashDrawerSessions/${sessionId}`;
            const batch = Nexus.adapter.batch();
            batch.set(path, newSession);
            await batch.commit();

            return { success: true, session: newSession };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const closeCashDrawerAction = createSafeAction(
    z.tuple([
        CashDrawerSessionSchema,
        z.number().int().min(0, 'montant en microunits requis'),
        z.number().int().min(0, 'montant en microunits requis'),
        z.number().int().min(0, 'montant en microunits requis')
    ]),
    { page: "pos", action: "close_register" },
    async (tenantId, session: CashDrawerSession, actualMu: number, collectedInMicrounits: number, changeGivenInMicrounits: number) => {
        try {
            const path = `tenants/${tenantId}/cashDrawerSessions/${session.id}`;
            const batch = Nexus.adapter.batch();
            batch.set(path, {
                ...session,
                closedAt: new Date().toISOString(),
                closingInMicrounits: actualMu,
                collectedInMicrounits,
                changeGivenInMicrounits,
            });
            await batch.commit();

            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);
