"use client";

import React from "react";
import { Sparkles, Shield, Trash2, Maximize2, Minimize2, X } from "lucide-react";
import type { AssistantViewMode } from "@/shared/hooks/useUniversalAssistant";

interface AssistantHeaderProps {
    viewMode: AssistantViewMode;
    setViewMode: (mode: AssistantViewMode) => void;
    clearSession: () => void;
}

export function AssistantHeader({ viewMode, setViewMode, clearSession }: AssistantHeaderProps) {
    return (
        <div className="flex items-center justify-between p-3.5 border-b border-border bg-bg-secondary/70">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">
                            Copilote NEXUS
                        </h3>
                        <span className="text-nano font-bold px-1.5 py-0.2 rounded bg-accent/20 text-accent uppercase">
                            Universal
                        </span>
                    </div>
                    <p className="text-nano text-text-muted flex items-center gap-1">
                        <Shield className="w-3 h-3 text-accent" />
                        <span>Membrane RBAC souveraine</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={clearSession}
                    className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary"
                    title="Réinitialiser la conversation"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                <button
                    onClick={() => setViewMode(viewMode === 'EXPANDED' ? 'DOCK_RIGHT' : 'EXPANDED')}
                    className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary hidden sm:block"
                    title={viewMode === 'EXPANDED' ? "Réduire en volet" : "Agrandir"}
                >
                    {viewMode === 'EXPANDED' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                    onClick={() => setViewMode('COLLAPSED')}
                    className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary"
                    title="Fermer (Échap)"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
