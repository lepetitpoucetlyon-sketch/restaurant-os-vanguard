"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, AlertTriangle, ReceiptText, RotateCcw, MinusCircle, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { processVoidOrRefundAction } from "../actions/void.action";

// ─── Types ────────────────────────────────────────────────────────────────────

type VoidMode = "void" | "refund";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseEuros(raw: string): number {
    const val = parseFloat(raw.replace(",", ".").trim());
    return isNaN(val) ? 0 : Math.max(0, val);
}

function eurosToCents(euros: number): number {
    return Math.round(euros * 100);
}

// ─── VoidModal ────────────────────────────────────────────────────────────────

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

    const originalCents = eurosToCents(parseEuros(originalAmountInput));
    const refundCents   = mode === "void"
        ? originalCents
        : eurosToCents(parseEuros(refundAmountInput));

    const canSubmit =
        pieceNumber.trim().length > 0 &&
        originalCents > 0 &&
        refundCents > 0 &&
        refundCents <= originalCents &&
        !isSubmitting;

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
            const negativeAmount = -refundCents; // NEGATIVE for extourne NF525
            const negativeAmountInMicrounits = negativeAmount * 10_000;

            const result = await processVoidOrRefundAction(
                tenantId,
                operatorId,
                mode,
                pieceNumber,
                negativeAmountInMicrounits,
                reason
            );

            if (!result.success) throw new Error(result.error);

            const label = mode === "void" ? "Annulation" : "Remboursement";
            toast.success(`${label} enregistré — réf: ${pieceNumber}`);
            setDone(true);
        } catch (err) {
            logger.error("[VoidModal] Échec enregistrement extourne/remboursement", { mode, pieceNumber, tenantId, operatorId, error: err });
            toast.error("Impossible d'enregistrer l'extourne. Réessayez.");
        } finally {
            setIsSubmitting(false);
        }
    }, [canSubmit, mode, pieceNumber, originalCents, refundCents, reason, tenantId, operatorId]);

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
                    {/* ── Header ──────────────────────────────────────────── */}
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
                        /* ── Success ────────────────────────────────────── */
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-status-success/10 flex items-center justify-center">
                                <MinusCircle className="w-7 h-7 text-status-success" />
                            </div>
                            <p className="text-sm font-black uppercase tracking-wider text-text-primary">
                                Extourne enregistrée
                            </p>
                            <p className="text-[11px] text-text-muted max-w-[260px]">
                                Une écriture négative a été créée dans journalEntries
                                et scellée conformément à NF525. Le ticket original est inchangé.
                            </p>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 h-12 rounded-full border border-border text-[11px] font-black uppercase tracking-wider text-text-muted hover:border-border/80 transition-colors"
                                >
                                    Nouvelle extourne
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-12 rounded-full bg-bg-tertiary text-[11px] font-black uppercase tracking-wider text-text-primary hover:opacity-80 transition-opacity"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── Form ───────────────────────────────────────── */
                        <div className="space-y-4">
                            {/* NF525 notice */}
                            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-status-warning/5 border border-status-warning/20">
                                <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                                <p className="text-[10px] text-text-muted leading-relaxed">
                                    Conforme NF525 : une écriture <strong>négative</strong> est créée
                                    dans journalEntries. Le ticket original n'est jamais modifié ni supprimé.
                                </p>
                            </div>

                            {/* Mode selector */}
                            <div className="grid grid-cols-2 gap-2">
                                {(["void", "refund"] as VoidMode[]).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={cn(
                                            "h-11 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all",
                                            mode === m
                                                ? "bg-status-error border-status-error/50 text-text-primary"
                                                : "bg-bg-primary border-border text-text-muted hover:border-status-error/30"
                                        )}
                                    >
                                        {m === "void" ? "Annulation totale" : "Remb. partiel"}
                                    </button>
                                ))}
                            </div>

                            {/* Ticket reference */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                                    Référence du ticket original
                                </label>
                                <div className="flex items-center gap-3 border border-border rounded-2xl px-4 h-12 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
                                    <ReceiptText className="w-4 h-4 text-text-muted shrink-0" />
                                    <input
                                        type="text"
                                        value={pieceNumber}
                                        onChange={(e) => setPieceNumber(e.target.value)}
                                        placeholder="Ex: 2026-000123"
                                        className="flex-1 bg-transparent text-[13px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Original amount */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                                    Montant original TTC (€)
                                </label>
                                <div className="flex items-center gap-3 border border-border rounded-2xl px-4 h-12 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
                                    <span className="text-sm text-text-muted font-mono shrink-0">€</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={originalAmountInput}
                                        onChange={(e) => setOriginalAmountInput(e.target.value)}
                                        placeholder="0,00"
                                        className="flex-1 bg-transparent text-[13px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Partial refund amount */}
                            {mode === "refund" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                >
                                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                                        Montant à rembourser (€, ≤ {(originalCents / 100).toFixed(2)} €)
                                    </label>
                                    <div className="flex items-center gap-3 border border-border rounded-2xl px-4 h-12 bg-bg-primary focus-within:border-status-error/50 transition-colors">
                                        <span className="text-sm text-text-muted font-mono shrink-0">€</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={refundAmountInput}
                                            onChange={(e) => setRefundAmountInput(e.target.value)}
                                            placeholder="0,00"
                                            className="flex-1 bg-transparent text-[13px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                                        />
                                    </div>
                                    {refundCents > originalCents && originalCents > 0 && (
                                        <p className="mt-1.5 text-[10px] text-status-error font-bold">
                                            Le remboursement ne peut pas dépasser le montant original
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {/* Optional reason */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                                    Motif (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Erreur de commande, insatisfaction client…"
                                    className="w-full border border-border rounded-2xl px-4 h-12 bg-bg-primary text-[13px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 transition-colors"
                                />
                            </div>

                            {/* Summary */}
                            {canSubmit && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-3 rounded-2xl bg-status-error/5 border border-status-error/20 text-[11px] flex items-center justify-between"
                                >
                                    <span className="text-text-muted uppercase tracking-wider font-bold">
                                        Écriture négative
                                    </span>
                                    <span className="font-mono text-status-error font-black text-sm">
                                        −{(refundCents / 100).toFixed(2)} €
                                    </span>
                                </motion.div>
                            )}

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="w-full h-14 rounded-2xl bg-status-error text-text-primary text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-status-error/90 active:scale-98 transition-all disabled:opacity-40"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {mode === "void" ? "Enregistrer l'annulation" : "Enregistrer le remboursement"}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
