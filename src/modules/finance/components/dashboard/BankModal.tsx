"use client";

import { Landmark, X } from "lucide-react";

interface BankModalProps {
    open: boolean;
    url: string | null;
    onClose: () => void;
}

export function BankModal({ open, url, onClose }: BankModalProps) {
    if (!open || !url) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl h-[600px] bg-surface-base rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-sidebar shrink-0">
                    <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-action-primary" />
                        <span className="text-sm font-medium">Connexion bancaire sécurisée (PSD2)</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-base transition-colors" aria-label="Fermer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <iframe src={url} className="flex-1 w-full border-0" title="Connexion bancaire sécurisée Powens" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
            </div>
        </div>
    );
}
