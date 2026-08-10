"use server";

import { Nexus } from "@/lib/nexus/NexusAdapter";
import { FiscalSealer } from "@/modules/finance/fiscalite/FiscalSealer";
import { IdGenerator } from "@/lib/utils/IdGenerator";
import { CryptoService } from "@/lib/CryptoService";
import type { JournalEntry } from "@nexus/contracts";
import { toError } from "@/lib/toError";

import { createSafeAction } from "@/shared/nexus/actions/actionWrapper";
import { z } from "zod";

const VoidPayloadSchema = z.tuple([
    z.string(),
    z.enum(["void", "refund"]),
    z.string(),
    z.number(),
    z.string().optional(),
    z.string().optional() // pin argument as the last string (optional because maybe UI doesn't send it yet)
]);

export const processVoidOrRefundAction = createSafeAction(
    VoidPayloadSchema,
    { page: "pos", action: "cancel_order" },
    async (tenantId, operatorId, mode, pieceNumber, negativeAmountInMicrounits, reason) => {
        try {
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
);
