"use server";

import { Nexus } from "@/lib/nexus/NexusAdapter";
import { IdGenerator } from "@/lib/utils/IdGenerator";
import { toError } from "@/lib/toError";
import type { CashDrawerSession } from "../components/CashDrawerModal";

import { createSafeAction } from "@/shared/nexus/actions/actionWrapper";
import { z } from "zod";

export const openCashDrawerAction = createSafeAction(
    z.tuple([z.string(), z.number()]),
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
    z.tuple([z.custom<unknown>(() => true), z.number(), z.number(), z.number()]),
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
