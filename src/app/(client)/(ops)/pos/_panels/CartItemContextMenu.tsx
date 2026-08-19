"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Percent, Tag, Gift, Trash2, X, Check, MessageSquare, Store, ShoppingBag, PackageOpen } from "lucide-react";
import type { ConsumptionMode } from "@/modules/ops";
import { cn } from "@/lib/ui.foundations";
import type { CartItem } from "@/modules/ops";
import type { PendingAction } from "../_hooks/useRbacGate";

const DISCOUNT_PRESETS = [5, 10, 15] as const;

interface Props {
    contextMenuItem:        CartItem | null;
    customDiscountValue:    string;
    noteValue:              string;
    offerRequiresPin:       boolean;
    cancelRequiresPin:      boolean;
    refundRequiresPin:      boolean;
    onClose:                () => void;
    onDiscountPreset:       (pct: number) => void;
    onDiscountCustom:       () => void;
    onDiscountCustomChange: (v: string) => void;
    onProtectedAction:      (action: PendingAction) => void;
    onNoteChange:           (v: string) => void;
    onNoteSave:             (cartId: string, note: string) => void;
    onNoteClear:            (cartId: string) => void;
    ticketConsumptionMode?: ConsumptionMode;
    onConsumptionModeOverride?: (cartId: string, mode: ConsumptionMode | undefined) => void;
    onToggleDoggyBag?: (cartId: string) => void;
}

export function CartItemContextMenu({
    contextMenuItem,
    customDiscountValue,
    noteValue,
    offerRequiresPin,
    cancelRequiresPin,
    refundRequiresPin,
    onClose,
    onDiscountPreset,
    onDiscountCustom,
    onDiscountCustomChange,
    onProtectedAction,
    onNoteChange,
    onNoteSave,
    onNoteClear,
    ticketConsumptionMode,
    onConsumptionModeOverride,
    onToggleDoggyBag,
}: Props) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contextMenuItem) return;
        const onOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, [contextMenuItem, onClose]);

    return (
        <AnimatePresence>
            {contextMenuItem && (
                <motion.div
                    key="ctx-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-8 sm:pb-0"
                >
                    <motion.div
                        ref={menuRef}
                        key="ctx-card"
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 32 }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className="bg-surface-card border border-border rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:w-[400px] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                                    Actions article
                                </h3>
                                <p className="text-[11px] text-accent-gold font-bold font-serif italic mt-0.5">
                                    {contextMenuItem.name}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Discount */}
                        <div className="mb-5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                                <Percent className="w-3 h-3" />
                                Appliquer remise
                            </p>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {DISCOUNT_PRESETS.map((pct) => {
                                    const isActive = contextMenuItem.discountPercent === pct;
                                    return (
                                        <button
                                            key={pct}
                                            onClick={() => onDiscountPreset(pct)}
                                            className={cn(
                                                "h-10 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all",
                                                isActive
                                                    ? "bg-accent-gold border-accent-gold text-text-primary shadow-md shadow-accent-gold/20"
                                                    : "bg-bg-primary border-border text-text-muted hover:border-accent-gold/40"
                                            )}
                                        >
                                            {pct}%
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center gap-2 border border-border rounded-full px-4 h-10 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
                                    <Tag className="w-3 h-3 text-text-muted shrink-0" />
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={customDiscountValue}
                                        onChange={(e) => onDiscountCustomChange(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && onDiscountCustom()}
                                        placeholder="% personnalisé"
                                        className="flex-1 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                                    />
                                </div>
                                <button
                                    onClick={onDiscountCustom}
                                    disabled={!customDiscountValue.trim()}
                                    className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:bg-accent-gold hover:text-text-primary transition-all disabled:opacity-30"
                                    aria-label="Appliquer"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                            {(contextMenuItem.discountPercent ?? 0) > 0 && (
                                <button
                                    onClick={() => onProtectedAction({ type: "discount", cartId: contextMenuItem.cartId, percent: 0 })}
                                    className="mt-2 text-[10px] text-status-error hover:underline font-bold tracking-wider"
                                >
                                    Retirer la remise actuelle ({contextMenuItem.discountPercent}%)
                                </button>
                            )}
                        </div>

                        {/* Note */}
                        <div className="mb-5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" />
                                Note cuisine
                            </p>
                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center gap-2 border border-border rounded-2xl px-4 h-10 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
                                    <input
                                        type="text"
                                        value={noteValue}
                                        onChange={(e) => onNoteChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                onNoteSave(contextMenuItem.cartId, noteValue);
                                            }
                                        }}
                                        placeholder="Sans oignons, bien cuit…"
                                        maxLength={200}
                                        className="flex-1 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => onNoteSave(contextMenuItem.cartId, noteValue)}
                                    className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:bg-accent-gold hover:text-text-primary transition-all"
                                    aria-label="Valider la note"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                            {contextMenuItem.notes && (
                                <button
                                    onClick={() => { onNoteClear(contextMenuItem.cartId); }}
                                    className="mt-2 text-[10px] text-status-error hover:underline font-bold tracking-wider"
                                >
                                    Effacer la note actuelle
                                </button>
                            )}
                        </div>

                        {/* Consumption mode per-line override (T12) */}
                        {onConsumptionModeOverride && (
                            <div className="mb-5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                                    <Store className="w-3 h-3" />
                                    Mode consommation
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {([undefined, 'dine_in', 'takeaway'] as const).map((mode) => {
                                        const currentMode = contextMenuItem.consumptionMode;
                                        const isActive = mode === undefined ? currentMode === undefined : currentMode === mode;
                                        const label = mode === undefined ? `Ticket (${ticketConsumptionMode === 'takeaway' ? 'Emp.' : 'SP'})` : mode === 'dine_in' ? 'Sur place' : 'Emporter';
                                        const Icon = mode === 'takeaway' ? ShoppingBag : Store;
                                        return (
                                            <button
                                                key={mode ?? 'inherit'}
                                                onClick={() => onConsumptionModeOverride(contextMenuItem.cartId, mode)}
                                                className={cn(
                                                    "h-10 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                                                    isActive
                                                        ? "bg-accent-gold border-accent-gold text-text-primary shadow-md shadow-accent-gold/20"
                                                        : "bg-bg-primary border-border text-text-muted hover:border-accent-gold/40"
                                                )}
                                            >
                                                {mode !== undefined && <Icon className="w-3 h-3" />}
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="h-px bg-border/50 mb-4" />

                        {/* Doggy bag toggle (T21) */}
                        {onToggleDoggyBag && (
                            <div className="mb-4">
                                <button
                                    onClick={() => onToggleDoggyBag(contextMenuItem.cartId)}
                                    className={cn(
                                        "w-full h-11 rounded-2xl border flex items-center gap-3 px-4 text-[11px] font-black uppercase tracking-wider transition-all",
                                        contextMenuItem.doggyBag
                                            ? "bg-action-primary/10 border-action-primary/30 text-action-primary"
                                            : "border-border bg-bg-primary text-text-muted hover:border-action-primary/40 hover:text-action-primary"
                                    )}
                                >
                                    <PackageOpen className="w-4 h-4 shrink-0" />
                                    {contextMenuItem.doggyBag ? 'Doggy bag marqué' : 'Marquer doggy bag'}
                                </button>
                            </div>
                        )}

                        {/* RBAC actions */}
                        <div className="space-y-2">
                            <button
                                onClick={() => onProtectedAction({ type: "offer", cartId: contextMenuItem.cartId })}
                                disabled={contextMenuItem.isOffer}
                                className={cn(
                                    "w-full h-11 rounded-2xl border flex items-center gap-3 px-4 text-[11px] font-black uppercase tracking-wider transition-all",
                                    contextMenuItem.isOffer
                                        ? "border-emerald-500/20 bg-status-success/5 text-status-success cursor-not-allowed"
                                        : "border-border bg-bg-primary text-text-muted hover:border-emerald-500/40 hover:text-status-success"
                                )}
                            >
                                <Gift className="w-4 h-4 shrink-0" />
                                {contextMenuItem.isOffer ? "Article offert" : "Offrir l'article"}
                                {!contextMenuItem.isOffer && offerRequiresPin && (
                                    <span className="ml-auto text-[8px] text-accent-gold border border-accent-gold/30 px-2 py-0.5 rounded-full">PIN</span>
                                )}
                            </button>

                            <button
                                onClick={() => onProtectedAction({ type: "cancel", cartId: contextMenuItem.cartId })}
                                className="w-full h-11 rounded-2xl border border-border bg-bg-primary flex items-center gap-3 px-4 text-[11px] font-black uppercase tracking-wider text-text-muted hover:border-status-error/40 hover:text-status-error transition-all"
                            >
                                <Trash2 className="w-4 h-4 shrink-0" />
                                Annuler l'article
                                {cancelRequiresPin && (
                                    <span className="ml-auto text-[8px] text-accent-gold border border-accent-gold/30 px-2 py-0.5 rounded-full">PIN</span>
                                )}
                            </button>

                            <button
                                onClick={() => onProtectedAction({ type: "refund", cartId: contextMenuItem.cartId })}
                                className="w-full h-11 rounded-2xl border border-border bg-bg-primary flex items-center gap-3 px-4 text-[11px] font-black uppercase tracking-wider text-text-muted hover:border-status-error/40 hover:text-status-error transition-all"
                            >
                                <X className="w-4 h-4 shrink-0" />
                                Rembourser l'article
                                {refundRequiresPin && (
                                    <span className="ml-auto text-[8px] text-accent-gold border border-accent-gold/30 px-2 py-0.5 rounded-full">PIN</span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
