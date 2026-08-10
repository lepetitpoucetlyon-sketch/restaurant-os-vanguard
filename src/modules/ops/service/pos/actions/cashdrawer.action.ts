"use server";

import { Nexus } from "@/lib/nexus/NexusAdapter";
import { IdGenerator } from "@/lib/utils/IdGenerator";
import { requireSession } from "@/lib/server/verifySession";
import { toError } from "@/lib/toError";
import type { CashDrawerSession } from "../components/CashDrawerModal";

export async function openCashDrawerAction(tenantId: string, userId: string, openingInMicrounits: number) {
    try {
        await requireSession(tenantId);
        
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

export async function closeCashDrawerAction(
    tenantId: string, 
    session: CashDrawerSession, 
    actualMu: number, 
    collectedInMicrounits: number, 
    changeGivenInMicrounits: number
) {
    try {
        await requireSession(tenantId);
        
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
