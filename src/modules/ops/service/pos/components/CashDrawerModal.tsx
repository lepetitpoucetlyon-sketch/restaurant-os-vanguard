"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet, X, AlertCircle, CheckCircle2, ArrowRight, DollarSign,
    TrendingUp, TrendingDown, Clock, Unlock,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { IdGenerator } from "@/lib/utils/IdGenerator";
import { toast } from "sonner";
import { cashDrawerService } from "@/modules/ops/service/pos/infrastructure/cash-drawer/CashDrawerService";
import { openCashDrawerAction, closeCashDrawerAction } from "../actions/cashdrawer.action";
import { JsonObject } from "@/shared/types/json";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CashDrawerSession {
    id: string;
    openedAt: string;
    openingInMicrounits: number;
    closedAt?: string;
    closingInMicrounits?: number;
    collectedInMicrounits: number;
    changeGivenInMicrounits: number;
    userId: string;
}

interface CashDrawerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    userId: string;
    collectedInMicrounits?: number;
    changeGivenInMicrounits?: number;
}

// ─── Euro input helper ────────────────────────────────────────────────────────

function parseEuros(raw: string): number {
    const normalized = raw.replace(",", ".").trim();
    const val = parseFloat(normalized);
    return isNaN(val) ? 0 : Math.max(0, val);
}

function eurosToMicrounits(euros: number): number {
    return Math.round(euros * 1_000_000);
}

function microunitsToEuros(mu: number): string {
    return (mu / 1_000_000).toFixed(2);
}

// ─── CashDrawerModal ──────────────────────────────────────────────────────────

export function CashDrawerModal({
    isOpen,
    onClose,
    tenantId,
    userId,
    collectedInMicrounits = 0,
    changeGivenInMicrounits = 0,
}: CashDrawerModalProps) {
    const [session, setSession] = useState<CashDrawerSession | null>(null);
    const [isFetchingSession, setIsFetchingSession] = useState(false);

    // ── Opening form state ────────────────────────────────────────────────────
    const [openingInput, setOpeningInput] = useState("");
    const [isOpening, setIsOpening] = useState(false);

    // ── Closing form state ────────────────────────────────────────────────────
    const [actualInput, setActualInput] = useState("");
    const [isClosing, setIsClosing] = useState(false);
    const [closed, setClosed] = useState(false);

    // ── Load active session ───────────────────────────────────────────────────
    const loadActiveSession = useCallback(async () => {
        setIsFetchingSession(true);
        try {
            const path = `tenants/${tenantId}/cashDrawerSessions`;
            const sessions = await Nexus.adapter.query<CashDrawerSession>(path, {
                where: [{ field: "closedAt", operator: "==", value: null }],
                orderBy: { field: "openedAt", direction: "desc" },
                limit: 1,
            });
            setSession(sessions[0] ?? null);
        } catch {
            // No open session — that's fine
            setSession(null);
        } finally {
            setIsFetchingSession(false);
        }
    }, [tenantId]);

    useEffect(() => {
        if (isOpen) {
            setClosed(false);
            setActualInput("");
            loadActiveSession();
        }
    }, [isOpen, loadActiveSession]);

    // ── Open the drawer ───────────────────────────────────────────────────────
    const handleOpen = useCallback(async () => {
        const euros = parseEuros(openingInput);
        if (euros <= 0) {
            toast.error("Saisissez un montant d'ouverture valide");
            return;
        }
        setIsOpening(true);
        try {
            const result = await openCashDrawerAction(tenantId, userId, eurosToMicrounits(euros));
            if (!result.success || !result.session) throw new Error(result.error);
            
            setSession(result.session);
            setOpeningInput("");
            void cashDrawerService.kick();
            toast.success(`Caisse ouverte — Fond : ${euros.toFixed(2)} €`);
        } catch {
            toast.error("Impossible d'ouvrir la caisse");
        } finally {
            setIsOpening(false);
        }
    }, [openingInput, tenantId, userId]);

    // ── Close the drawer ──────────────────────────────────────────────────────
    const handleClose = useCallback(async () => {
        if (!session) return;
        const actualEuros = parseEuros(actualInput);
        if (actualEuros < 0) {
            toast.error("Montant réel invalide");
            return;
        }
        setIsClosing(true);
        try {
            const actualMu = eurosToMicrounits(actualEuros);
            const theoreticalMu =
                session.openingInMicrounits + collectedInMicrounits - changeGivenInMicrounits;

            const result = await closeCashDrawerAction(tenantId, session, actualMu, collectedInMicrounits, changeGivenInMicrounits);
            if (!result.success) throw new Error(result.error);

            const diffMu = actualMu - theoreticalMu;
            const sign = diffMu >= 0 ? "+" : "";
            toast.success(
                `Caisse clôturée — Écart : ${sign}${(diffMu / 1_000_000).toFixed(2)} €`
            );
            setClosed(true);
            setSession(null);
        } catch {
            toast.error("Impossible de clôturer la caisse");
        } finally {
            setIsClosing(false);
        }
    }, [session, actualInput, collectedInMicrounits, changeGivenInMicrounits, tenantId]);

    // ── Derived: theoretical closing amount ───────────────────────────────────
    const theoreticalMu = session
        ? session.openingInMicrounits + collectedInMicrounits - changeGivenInMicrounits
        : 0;

    const actualMu  = eurosToMicrounits(parseEuros(actualInput));
    const diffMu    = actualInput.trim() ? actualMu - theoreticalMu : null;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="cd-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-8 sm:pb-0"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    key="cd-card"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    className="bg-surface-card border border-border rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:w-[440px] shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-accent-gold" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                                    Fond de caisse
                                </h3>
                                <p className="text-[10px] text-text-muted uppercase tracking-wider">
                                    {session ? "Session en cours" : closed ? "Session clôturée" : "Aucune session ouverte"}
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

                    {isFetchingSession ? (
                        <div className="flex items-center justify-center py-8 text-text-muted">
                            <div className="w-5 h-5 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
                        </div>
                    ) : closed ? (
                        /* ── Success state ──────────────────────────────────── */
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <CheckCircle2 className="w-10 h-10 text-status-success" />
                            <p className="text-sm font-black uppercase tracking-wider text-text-primary">
                                Caisse clôturée
                            </p>
                            <p className="text-[11px] text-text-muted">
                                Résultats enregistrés dans Nexus
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-2 w-full h-12 rounded-full bg-bg-tertiary text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    ) : !session ? (
                        /* ── Open drawer form ───────────────────────────────── */
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2">
                                    Fond d'ouverture (€)
                                </label>
                                <div className="flex items-center gap-3 border border-border rounded-2xl px-4 h-14 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
                                    <DollarSign className="w-4 h-4 text-text-muted shrink-0" />
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={openingInput}
                                        onChange={(e) => setOpeningInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleOpen()}
                                        placeholder="Ex: 200,00"
                                        className="flex-1 bg-transparent text-lg font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                                    />
                                    <span className="text-sm text-text-muted font-mono">€</span>
                                </div>
                            </div>

                            <button
                                onClick={handleOpen}
                                disabled={isOpening || !openingInput.trim()}
                                className="w-full h-14 rounded-2xl bg-accent-gold text-text-primary text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent-gold/90 active:scale-98 transition-all disabled:opacity-40"
                            >
                                {isOpening ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Wallet className="w-4 h-4" />
                                        Ouvrir la caisse
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* ── Close drawer form ──────────────────────────────── */
                        <div className="space-y-4">
                            {/* Session info */}
                            <div className="rounded-2xl bg-bg-tertiary/50 border border-border/50 p-4 space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-text-muted flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        Ouverture
                                    </span>
                                    <span className="font-mono text-text-primary">
                                        {new Date(session.openedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-text-muted">Fond initial</span>
                                    <span className="font-mono text-text-primary font-bold">
                                        {microunitsToEuros(session.openingInMicrounits)} €
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-text-muted flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3 text-status-success" />
                                        Espèces encaissées
                                    </span>
                                    <span className="font-mono text-status-success font-bold">
                                        +{microunitsToEuros(collectedInMicrounits)} €
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-text-muted flex items-center gap-1.5">
                                        <TrendingDown className="w-3 h-3 text-status-error" />
                                        Monnaie rendue
                                    </span>
                                    <span className="font-mono text-status-error font-bold">
                                        -{microunitsToEuros(changeGivenInMicrounits)} €
                                    </span>
                                </div>
                                <div className="h-px bg-border/50" />
                                <div className="flex items-center justify-between text-[12px]">
                                    <span className="font-black text-text-primary uppercase tracking-wider">Fond théorique</span>
                                    <span className="font-mono font-black text-accent-gold">
                                        {microunitsToEuros(theoreticalMu)} €
                                    </span>
                                </div>
                            </div>

                            {/* Actual amount input */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2">
                                    Fond réel compté (€)
                                </label>
                                <div className="flex items-center gap-3 border border-border rounded-2xl px-4 h-14 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
                                    <DollarSign className="w-4 h-4 text-text-muted shrink-0" />
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={actualInput}
                                        onChange={(e) => setActualInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleClose()}
                                        placeholder={`Attendu : ${microunitsToEuros(theoreticalMu)}`}
                                        className="flex-1 bg-transparent text-lg font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                                    />
                                    <span className="text-sm text-text-muted font-mono">€</span>
                                </div>
                            </div>

                            {/* Difference display */}
                            {diffMu !== null && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className={cn(
                                        "flex items-center justify-between rounded-2xl px-4 py-3 text-[12px] font-black",
                                        Math.abs(diffMu) < 500_000
                                            ? "bg-status-success/10 text-status-success border border-status-success/20"
                                            : "bg-status-error/10 text-status-error border border-status-error/20"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {Math.abs(diffMu) < 500_000
                                            ? <CheckCircle2 className="w-4 h-4" />
                                            : <AlertCircle className="w-4 h-4" />}
                                        <span className="uppercase tracking-widest">Écart</span>
                                    </div>
                                    <span className="font-mono text-base">
                                        {diffMu >= 0 ? "+" : ""}{(diffMu / 1_000_000).toFixed(2)} €
                                    </span>
                                </motion.div>
                            )}

                            {/* Manual drawer kick */}
                            <button
                                onClick={() => { void cashDrawerService.kick(); toast.info('Tiroir-caisse ouvert'); }}
                                className="w-full h-10 rounded-2xl border border-border/50 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary hover:border-border transition-colors flex items-center justify-center gap-2"
                            >
                                <Unlock className="w-3.5 h-3.5" />
                                Ouvrir le tiroir
                            </button>

                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                disabled={isClosing || !actualInput.trim()}
                                className="w-full h-14 rounded-2xl bg-text-primary text-bg-primary text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all disabled:opacity-40 dark:bg-accent-gold dark:text-text-primary"
                            >
                                {isClosing ? (
                                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Clôturer la caisse
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
