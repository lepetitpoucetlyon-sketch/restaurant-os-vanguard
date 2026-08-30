/**
 * 🪄 DesignAgentBar — Barre de prompt IA OpenPencil / Hermes pour concevoir et transformer la page
 */

"use client";

import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { PageDocument } from '@/kernel/open-pencil/schema/PenDocument';
import { Button } from "@/shared/components/ui/Button";

interface DesignAgentBarProps {
    page: PageDocument;
    onApplyAgentTransform: (instruction: string) => Promise<void>;
}

const QUICK_PROMPTS = [
    'Applique un thème Or & Noir Gastronomique avec typographie Cormorant',
    'Augmente la taille des boutons tactiles à 48px pour écran de caisse',
    'Ajoute un bandeau de promotion et passe le layout en 3 colonnes',
    'Vérifie et corrige les contrastes d accessibilité WCAG AA',
];

export const DesignAgentBar: React.FC<DesignAgentBarProps> = ({
    page,
    onApplyAgentTransform,
}) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastSuccess, setLastSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setLastSuccess(null);
        try {
            await onApplyAgentTransform(prompt);
            setLastSuccess('Page transformée avec succès par l Agent IA !');
            setPrompt('');
            setTimeout(() => setLastSuccess(null), 4000);
        } catch {
            // handled
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-3 bg-bg-secondary border-t border-white/10 select-none">
            <div className="max-w-4xl mx-auto space-y-2">
                {/* Suggestions */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 flex items-center gap-1 shrink-0">
                        <Bot className="w-3 h-3" />
                        IA Prompt :
                    </span>
                    {QUICK_PROMPTS.map((qp, idx) => (
                        <Button variant="ghost"
                            key={idx}
                            onClick={() => setPrompt(qp)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/5 whitespace-nowrap transition-colors"
                        >
                            {qp}
                        </Button>
                    ))}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-400">
                        <Sparkles className="w-4 h-4" />
                    </div>

                    <input
                        type="text"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder={`Demandez à l'IA d'adapter visuellement "${page.name}" pour vos clients...`}
                        disabled={isLoading}
                        className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-bg-tertiary/60 border border-white/10 text-xs text-text-primary placeholder-neutral-500 focus:outline-none focus:border-amber-400/50 shadow-inner"
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {lastSuccess && (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{lastSuccess}</span>
                            </div>
                        )}
                        <button aria-label="Chargement"
                            type="submit"
                            disabled={!prompt.trim() || isLoading}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs flex items-center gap-1.5 disabled:opacity-30 transition-all shadow-md shadow-amber-950/40"
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <>
                                    <span>Générer</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
