"use client";

import { Loader2, AlertCircle, Terminal, X } from "lucide-react";
import { useLanguage } from "@/shared/hooks";

export type TerminalState = "idle" | "pending" | "manual_wait" | "error";

interface TerminalStatePanelProps {
    terminalState: TerminalState;
    terminalError: string | null;
    onTerminalCancel: () => void;
    onManualConfirm: () => void;
    onManualCancel: () => void;
    onErrorDismiss: () => void;
}

export function TerminalStatePanel({
    terminalState,
    terminalError,
    onTerminalCancel,
    onManualConfirm,
    onManualCancel,
    onErrorDismiss,
}: TerminalStatePanelProps) {
    const { t } = useLanguage();
    if (terminalState === "pending") {
        return (
            <div className="flex flex-col items-center gap-4 py-8 rounded-[2rem] border border-accent-gold/20 bg-accent-gold/5">
                <Terminal className="w-10 h-10 text-accent-gold animate-pulse" strokeWidth={1.5} />
                <p className="text-sm font-black uppercase tracking-widest text-text-primary">En attente du terminal…</p>
                <p className="text-nano text-text-muted">{t('pos.flow.terminal.presentCard')}</p>
                <button
                    onClick={onTerminalCancel}
                    className="mt-2 px-6 h-10 rounded-full border border-border/50 text-micro font-black uppercase tracking-wider text-text-muted hover:text-status-error hover:border-status-error/30 transition-colors"
                >
                    Annuler
                </button>
            </div>
        );
    }

    if (terminalState === "manual_wait") {
        return (
            <div className="flex flex-col items-center gap-4 py-8 rounded-[2rem] border border-border bg-bg-tertiary/40">
                <Loader2 className="w-10 h-10 text-text-muted animate-spin" strokeWidth={1.5} />
                <p className="text-sm font-black uppercase tracking-widest text-text-primary">En attente de confirmation</p>
                <p className="text-nano text-text-muted">Collectez le paiement sur votre terminal externe</p>
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={onManualCancel}
                        className="px-6 h-10 rounded-full border border-border/50 text-micro font-black uppercase tracking-wider text-text-muted hover:text-status-error transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onManualConfirm}
                        className="px-6 h-10 rounded-full bg-accent-gold text-text-primary text-micro font-black uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
                    >
                        Paiement reçu
                    </button>
                </div>
            </div>
        );
    }

    if (terminalState === "error") {
        return (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-status-error/10 border border-status-error/20">
                <AlertCircle className="w-5 h-5 text-status-error shrink-0" />
                <div>
                    <p className="text-micro font-black uppercase tracking-wider text-status-error">{t('pos.flow.terminal.declined')}</p>
                    <p className="text-nano text-text-muted mt-0.5">{terminalError ?? "Réessayez ou changez de mode"}</p>
                </div>
                <button aria-label="Fermer"
                    onClick={onErrorDismiss}
                    className="ml-auto text-text-muted hover:text-text-primary"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return null;
}
