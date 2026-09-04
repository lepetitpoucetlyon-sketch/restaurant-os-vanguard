"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ReceiptText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { VoidMode } from "./voidHelpers";

import { useLanguage } from "@/shared/hooks";
interface VoidFormFieldsProps {
    mode: VoidMode;
    setMode: (m: VoidMode) => void;
    pieceNumber: string;
    setPieceNumber: (v: string) => void;
    originalAmountInput: string;
    setOriginalAmountInput: (v: string) => void;
    refundAmountInput: string;
    setRefundAmountInput: (v: string) => void;
    reason: string;
    setReason: (v: string) => void;
    originalMicrounits: number;
    refundMicrounits: number;
    canSubmit: boolean;
    isSubmitting: boolean;
    handleSubmit: () => Promise<void>;
}

export function VoidFormFields({
    mode,
    setMode,
    pieceNumber,
    setPieceNumber,
    originalAmountInput,
    setOriginalAmountInput,
    refundAmountInput,
    setRefundAmountInput,
    reason,
    setReason,
    originalMicrounits,
    refundMicrounits,
    canSubmit,
    isSubmitting,
    handleSubmit,
}: VoidFormFieldsProps) {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            {/* NF525 notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-status-warning/5 border border-status-warning/20">
                <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                <p className="text-nano text-text-muted leading-relaxed">
                    Conforme NF525 : une écriture <strong>{t('commerce.pos.negative')}</strong> est créée
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
                            "h-11 rounded-2xl border text-micro font-black uppercase tracking-wider transition-all",
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
                <label className="text-chip-label-sm text-text-muted block mb-1.5">
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
                <label className="text-chip-label-sm text-text-muted block mb-1.5">
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
                    <label className="text-chip-label-sm text-text-muted block mb-1.5">
                        Montant à rembourser (€, ≤ {(originalMicrounits / 1_000_000).toFixed(2)} €)
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
                    {refundMicrounits > originalMicrounits && originalMicrounits > 0 && (
                        <p className="mt-1.5 text-nano text-status-error font-bold">
                            Le remboursement ne peut pas dépasser le montant original
                        </p>
                    )}
                </motion.div>
            )}

            {/* Optional reason */}
            <div>
                <label className="text-chip-label-sm text-text-muted block mb-1.5">
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
                    className="p-3 rounded-2xl bg-status-error/5 border border-status-error/20 text-micro flex items-center justify-between"
                >
                    <span className="text-text-muted uppercase tracking-wider font-bold">
                        Écriture négative
                    </span>
                    <span className="font-mono text-status-error font-black text-sm">
                        −{(refundMicrounits / 1_000_000).toFixed(2)} €
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
    );
}
