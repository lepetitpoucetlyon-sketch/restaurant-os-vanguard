"use client";

// @wip owner:intelligence-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
import React, { useState } from "react";
import { ActionProposal } from "../services/AssistantActionDispatcher";
import { Zap, CheckCircle2, XCircle, Shield, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface ActionProposalCardProps {
    proposal: ActionProposal;
    onExecute: (proposal: ActionProposal) => Promise<void>;
    onDismiss?: (proposalId: string) => void;
}

export function ActionProposalCard({ proposal, onExecute, onDismiss }: ActionProposalCardProps) {
    const [isExecuting, setIsExecuting] = useState(false);
    const [status, setStatus] = useState<'proposed' | 'executed' | 'rejected'>(proposal.status);
    const [executionMessage, setExecutionMessage] = useState<string | null>(null);

    const handleExecute = async () => {
        setIsExecuting(true);
        try {
            await onExecute(proposal);
            setStatus('executed');
            setExecutionMessage('Action validée et répercutée sur le système.');
        } catch (err) {
            setStatus('rejected');
            setExecutionMessage(err instanceof Error ? err.message : 'Échec de l\'exécution');
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className={cn(
            "my-2.5 p-3.5 rounded-xl border transition-all duration-300",
            status === 'executed' 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : status === 'rejected'
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-bg-secondary/90 border-accent/30 text-text-primary shadow-lg shadow-black/20"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                        <Zap className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-accent">
                            Action Proposée
                        </h4>
                        <p className="text-xs font-semibold">{proposal.title}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-nano px-2 py-0.5 rounded-full bg-bg-tertiary border border-border text-text-muted">
                    <Shield className="w-3 h-3 text-accent" />
                    <span>Niv. {proposal.minRoleLevel}</span>
                </div>
            </div>

            {/* Description */}
            <p className="text-xs text-text-secondary mb-2.5 leading-relaxed">
                {proposal.description}
            </p>

            {/* Params Snippet */}
            {Object.keys(proposal.params).length > 0 && (
                <div className="bg-bg-tertiary/60 rounded-lg p-2 mb-3 text-micro font-mono border border-border/50 text-text-muted space-y-1">
                    {Object.entries(proposal.params).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between">
                            <span className="text-text-muted">{key}:</span>
                            <span className="text-accent font-semibold">{String(val)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Status / Buttons */}
            {status === 'proposed' && (
                <div className="flex items-center gap-2 pt-1">
                    <button aria-label="Chargement"
                        onClick={handleExecute}
                        disabled={isExecuting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-accent hover:bg-accent/90 text-bg-primary font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isExecuting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Exécution...</span>
                            </>
                        ) : (
                            <>
                                <span>Exécuter</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>

                    {onDismiss && (
                        <button
                            onClick={() => onDismiss(proposal.id)}
                            disabled={isExecuting}
                            className="py-1.5 px-3 rounded-lg bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-muted text-xs font-semibold transition-colors"
                        >
                            Ignorer
                        </button>
                    )}
                </div>
            )}

            {status === 'executed' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{executionMessage || 'Exécuté avec succès'}</span>
                </div>
            )}

            {status === 'rejected' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 pt-1">
                    <XCircle className="w-4 h-4" />
                    <span>{executionMessage || 'Action rejetée'}</span>
                </div>
            )}
        </div>
    );
}
