"use server";

import { Nexus } from "@/lib/nexus/NexusAdapter";
import { FiscalSealer } from "@/modules/finance/fiscalite/FiscalSealer";
import { IdGenerator } from "@/lib/utils/IdGenerator";
import { CryptoService } from "@/lib/CryptoService";
import type { JournalEntry } from "@nexus/contracts";
import { verifySession } from "@/lib/server/verifySession";
import { toError } from "@/lib/toError";

export async function processVoidOrRefundAction(
    tenantId: string,
    operatorId: string,
    mode: "void" | "refund",
    pieceNumber: string,
    negativeAmountInMicrounits: number,
    reason: string
) {
    try {
        await verifySession(tenantId);
        
        const entryId       = IdGenerator.generateWithPrefix("JE");
        const now           = new Date().toISOString();

        // Canonical snapshot for hash chain
        const dataSnapshot = CryptoService.canonicalStringify({
            id:            entryId,
            type:          mode === "void" ? "void" : "refund",
            linkedTicketId: pieceNumber,
            operatorId,
            amountInMicrounits: negativeAmountInMicrounits,
            timestamp:     now,
        } as import("@/shared/nexus-contract").SovereignData);

        const { hash, signature, sealId, previousHash } =
            await FiscalSealer.sealDataAtomically(dataSnapshot, tenantId, false);

        // Build extourne JournalEntry (NEGATIVE, NF525-compliant)
        const voidEntry: Partial<JournalEntry> & Record<string, unknown> = {
            id:              entryId,
            date:            now,
            pieceNumber:     IdGenerator.generateWithPrefix("VOID"),
            description:     `${mode === "void" ? "Extourne" : "Remb. partiel"} — réf: ${pieceNumber}${reason ? ` — ${reason}` : ""}`,
            referenceId:     pieceNumber,
            referenceType:   "order",
            isSystemGenerated: true,
            isValidated:     true,
            fiscalSealHash:  hash,
            sealedAt:        now,
            type:            mode === "void" ? "loss" : "other",
            amountInMicrounits: negativeAmountInMicrounits,
            status:          mode === "void" ? "cancelled" : "refunded",
            updatedAt:       now,
            cancellationRef: pieceNumber,
            linkedTicketId:  pieceNumber,
            voidMode:        mode,
            totalInMicrounits: negativeAmountInMicrounits,
            sealId,
            previousHash,
            signature,
            lines:           [],
        };

        const batch = Nexus.adapter.batch();
        batch.set(`tenants/${tenantId}/journalEntries/${entryId}`, voidEntry);
        await batch.commit();

        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}
