"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { FiscalSealer } from "@/modules/finance/fiscalite/FiscalSealer";
import { IdGenerator } from "@/lib/utils/IdGenerator";
import { CryptoService } from "@/lib/CryptoService";
import type { JournalEntry } from "@nexus/contracts";
import { toast } from "sonner";

import { parseEurosToMicrounits, type VoidMode } from "./void-modal/voidHelpers";
import { VoidSuccessView } from "./void-modal/VoidSuccessView";
import { VoidFormFields } from "./void-modal/VoidFormFields";

interface VoidModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    operatorId: string;
    /** If provided, pre-fills the reference and amount fields. */
    prefill?: {
        pieceNumber: string;
        originalAmountInMicrounits: number;
    };
}

export function VoidModal({
    isOpen,
    onClose,
    tenantId,
    operatorId,
    prefill,
}: VoidModalProps) {
    const [mode, setMode] = useState<VoidMode>("void");
    const [pieceNumber, setPieceNumber] = useState(prefill?.pieceNumber ?? "");
    const [originalAmountInput, setOriginalAmountInput] = useState(
        prefill ? (prefill.originalAmountInMicrounits / 1_000_000).toFixed(2) : ""
    );
    const [refundAmountInput, setRefundAmountInput] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // ── Validation ────────────────────────────────────────────────────────────

    const originalMicrounits = parseEurosToMicrounits(originalAmountInput);
    const refundMicrounits = mode === "void"
        ? originalMicrounits
        : parseEurosToMicrounits(refundAmountInput);

    const canSubmit =
        pieceNumber.trim().length > 0 &&
        originalMicrounits > 0 &&
        refundMicrounits > 0 &&
        refundMicrounits <= originalMicrounits &&
        !isSubmitting;

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
            const entryId = IdGenerator.generateWithPrefix("JE");
            const now = new Date().toISOString();
            const negativeAmountInMicrounits = -refundMicrounits; // NEGATIVE for extourne NF525

            // Canonical snapshot for hash chain
            const dataSnapshot = CryptoService.canonicalStringify({
                id: entryId,
                type: mode === "void" ? "void" : "refund",
                linkedTicketId: pieceNumber,
                operatorId,
                amountInMicrounits: negativeAmountInMicrounits,
                timestamp: now,
            } as import("@/shared/nexus-contract").SovereignData);

            const { hash, signature, sealId, previousHash } =
                await FiscalSealer.sealDataAtomically(dataSnapshot, tenantId, false);

            // Build extourne JournalEntry (NEGATIVE, NF525-compliant)
            const voidEntry: Partial<JournalEntry> & Record<string, unknown> = {
                id: entryId,
                date: now,
                pieceNumber: IdGenerator.generateWithPrefix("VOID"),
                description: `${mode === "void" ? "Extourne" : "Remb. partiel"} — réf: ${pieceNumber}${reason ? ` — ${reason}` : ""}`,
                referenceId: pieceNumber,
                referenceType: "order",
                isSystemGenerated: true,
                isValidated: true,
                fiscalSealHash: hash,
                sealedAt: now,
                type: mode === "void" ? "loss" : "other",
                amountInMicrounits: negativeAmountInMicrounits,
                status: mode === "void" ? "cancelled" : "refunded",
                updatedAt: now,
                cancellationRef: pieceNumber,
                linkedTicketId: pieceNumber,
                voidMode: mode,
                totalInMicrounits: negativeAmountInMicrounits,
                sealId,
                previousHash,
                signature,
                lines: [],
            };

            const batch = Nexus.adapter.batch();
            batch.set(`tenants/${tenantId}/journalEntries/${entryId}`, voidEntry);
            await batch.commit();

            const label = mode === "void" ? "Annulation" : "Remboursement";
            toast.success(`${label} enregistré — réf: ${pieceNumber}`);
            setDone(true);
        } catch {
            toast.error("Impossible d'enregistrer l'extourne. Réessayez.");
        } finally {
            setIsSubmitting(false);
        }
    }, [canSubmit, mode, pieceNumber, originalMicrounits, refundMicrounits, reason, tenantId, operatorId]);

    const handleReset = useCallback(() => {
        setDone(false);
        setMode("void");
        setPieceNumber(prefill?.pieceNumber ?? "");
        setOriginalAmountInput(prefill ? (prefill.originalAmountInMicrounits / 1_000_000).toFixed(2) : "");
        setRefundAmountInput("");
        setReason("");
    }, [prefill]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="void-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-8 sm:pb-0"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    key="void-card"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    className="bg-surface-card border border-border rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:w-[460px] shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-status-error/10 flex items-center justify-center">
                                <RotateCcw className="w-4 h-4 text-status-error" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                                    Annulation / Remboursement
                                </h3>
                                <p className="text-[10px] text-text-muted uppercase tracking-wider">
                                    Extourne NF525 — jamais de suppression
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {done ? (
                        <VoidSuccessView
                            onReset={handleReset}
                            onClose={onClose}
                        />
                    ) : (
                        <VoidFormFields
                            mode={mode}
                            setMode={setMode}
                            pieceNumber={pieceNumber}
                            setPieceNumber={setPieceNumber}
                            originalAmountInput={originalAmountInput}
                            setOriginalAmountInput={setOriginalAmountInput}
                            refundAmountInput={refundAmountInput}
                            setRefundAmountInput={setRefundAmountInput}
                            reason={reason}
                            setReason={setReason}
                            originalMicrounits={originalMicrounits}
                            refundMicrounits={refundMicrounits}
                            canSubmit={canSubmit}
                            isSubmitting={isSubmitting}
                            handleSubmit={handleSubmit}
                        />
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
