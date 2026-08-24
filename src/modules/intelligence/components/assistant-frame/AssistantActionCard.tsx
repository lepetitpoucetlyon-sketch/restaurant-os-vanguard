"use client";

import React, { useState } from "react";
import { ActionProposal } from "../../services/AssistantActionDispatcher";
import { 
    Zap, 
    CheckCircle2, 
    XCircle, 
    Shield, 
    ArrowRight, 
    Loader2, 
    Utensils, 
    Flame, 
    ShoppingBag, 
    Scissors, 
    Wrench, 
    Bed, 
    Activity, 
    KeyRound, 
    DollarSign 
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface AssistantActionCardProps {
    proposal: ActionProposal;
    onExecute: (proposal: ActionProposal) => Promise<void>;
    onDismiss?: (proposalId: string) => void;
}

export function AssistantActionCard({ proposal, onExecute, onDismiss }: AssistantActionCardProps) {
    const [isExecuting, setIsExecuting] = useState(false);
    const [status, setStatus] = useState<'proposed' | 'executed' | 'rejected'>(proposal.status);
    const [executionMessage, setExecutionMessage] = useState<string | null>(null);

    const handleExecute = async () => {
        setIsExecuting(true);
        try {
            await onExecute(proposal);
            setStatus('executed');
            setExecutionMessage('Action validée et synchronisée avec le réseau.');
        } catch (err) {
            setStatus('rejected');
            setExecutionMessage(err instanceof Error ? err.message : 'Échec de l\'exécution');
        } finally {
            setIsExecuting(false);
        }
    };

    const getSectorIcon = (toolId: string) => {
        if (toolId.includes('course') || toolId.includes('stock')) return <Utensils className="w-3.5 h-3.5" />;
        if (toolId.includes('baking') || toolId.includes('tgtg')) return <Flame className="w-3.5 h-3.5" />;
        if (toolId.includes('ean') || toolId.includes('boutique')) return <ShoppingBag className="w-3.5 h-3.5" />;
        if (toolId.includes('chair') || toolId.includes('treatment')) return <Scissors className="w-3.5 h-3.5" />;
        if (toolId.includes('repair') || toolId.includes('waste')) return <Wrench className="w-3.5 h-3.5" />;
        if (toolId.includes('room') || toolId.includes('police')) return <Bed className="w-3.5 h-3.5" />;
        if (toolId.includes('practitioner') || toolId.includes('hds')) return <Activity className="w-3.5 h-3.5" />;
        if (toolId.includes('luxury') || toolId.includes('seal')) return <KeyRound className="w-3.5 h-3.5" />;
        if (toolId.includes('financial') || toolId.includes('invoice')) return <DollarSign className="w-3.5 h-3.5" />;
        return <Zap className="w-3.5 h-3.5" />;
    };

    const getRoleBadgeStyle = (level: number) => {
        if (level >= 90) return "bg-purple-500/20 text-purple-300 border-purple-500/40";
        if (level >= 70) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
        if (level >= 50) return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
        if (level >= 30) return "bg-blue-500/20 text-blue-300 border-blue-500/40";
        return "bg-zinc-500/20 text-text-secondary border-zinc-500/40";
    };

    return (
        <div className={cn(
            "my-2.5 p-3.5 rounded-xl border transition-all duration-300",
            status === 'executed' 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-950/20"
                : status === 'rejected'
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-md shadow-rose-950/20"
                : "bg-bg-secondary/90 border-accent/30 text-text-primary shadow-lg shadow-black/20"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                        {getSectorIcon(proposal.toolId)}
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent">
                            Action Proposée
                        </h4>
                        <p className="text-xs font-bold text-text-primary">{proposal.title}</p>
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    getRoleBadgeStyle(proposal.minRoleLevel)
                )}>
                    <Shield className="w-3 h-3" />
                    <span>Niv. {proposal.minRoleLevel}</span>
                </div>
            </div>

            {/* Description */}
            <p className="text-xs text-text-secondary mb-2.5 leading-relaxed">
                {proposal.description}
            </p>

            {/* Paramètres Clés */}
            {Object.keys(proposal.params).length > 0 && (
                <div className="bg-bg-tertiary/60 rounded-lg p-2.5 mb-3 text-[11px] font-mono border border-border/50 text-text-muted space-y-1">
                    {Object.entries(proposal.params).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between">
                            <span className="text-text-muted">{key}:</span>
                            <span className="text-accent font-semibold">{String(val)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Status & Boutons d'Action */}
            {status === 'proposed' && (
                <div className="flex items-center gap-2 pt-1">
                    <button
                        onClick={handleExecute}
                        disabled={isExecuting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-accent hover:bg-accent/90 text-bg-primary font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isExecuting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Exécution en cours...</span>
                            </>
                        ) : (
                            <>
                                <span>Confirmer & Exécuter</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>

                    {onDismiss && (
                        <button
                            onClick={() => onDismiss(proposal.id)}
                            disabled={isExecuting}
                            className="py-2 px-3 rounded-lg bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-muted text-xs font-semibold border border-border transition-colors disabled:opacity-50"
                        >
                            Ignorer
                        </button>
                    )}
                </div>
            )}

            {/* Message de Succès */}
            {status === 'executed' && (
                <div className="flex items-center gap-2 pt-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{executionMessage || 'Action exécutée avec succès.'}</span>
                </div>
            )}

            {/* Message de Rejet */}
            {status === 'rejected' && (
                <div className="flex items-center gap-2 pt-1 text-xs text-rose-400 font-medium">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{executionMessage || 'Action rejetée ou non-autorisée.'}</span>
                </div>
            )}
        </div>
    );
}
