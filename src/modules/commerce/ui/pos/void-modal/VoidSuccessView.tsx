"use client";

import { MinusCircle } from "lucide-react";

interface VoidSuccessViewProps {
    onReset: () => void;
    onClose: () => void;
}

export function VoidSuccessView({ onReset, onClose }: VoidSuccessViewProps) {
    return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-status-success/10 flex items-center justify-center">
                <MinusCircle className="w-7 h-7 text-status-success" />
            </div>
            <p className="text-sm font-black uppercase tracking-wider text-text-primary">
                Extourne enregistrée
            </p>
            <p className="text-micro text-text-muted max-w-[260px]">
                Une écriture négative a été créée dans journalEntries
                et scellée conformément à NF525. Le ticket original est inchangé.
            </p>
            <div className="flex gap-3 w-full mt-2">
                <button
                    onClick={onReset}
                    className="flex-1 h-12 rounded-full border border-border text-micro font-black uppercase tracking-wider text-text-muted hover:border-border/80 transition-colors"
                >
                    Nouvelle extourne
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 h-12 rounded-full bg-bg-tertiary text-micro font-black uppercase tracking-wider text-text-primary hover:opacity-80 transition-opacity"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
}
