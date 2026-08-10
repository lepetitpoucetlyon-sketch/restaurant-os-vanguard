"use server";

import { verifySession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

export async function saveEventQuoteDraft(tenantId: string, quoteId: string, payload: Record<string, unknown>) {
    try {
        // Validation de sécurité (SovereignGuard)
        await verifySession(tenantId);

        // Au lieu d'écrire directement dans NexusAdapter, on émet un événement métier
        // Le ServerEventBus et l'Outbox vont s'occuper de traiter cela de façon sécurisée
        await NexusEventBus.emitDurable('eventQuote.draft.saved', {
            v: 1,
            tenantId,
            quoteId,
            payload,
            timestamp: Date.now(),
        });

        return { success: true };
    } catch (err) {
        const error = toError(err);
        return { success: false, error: error.message };
    }
}
