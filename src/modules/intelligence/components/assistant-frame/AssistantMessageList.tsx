"use client";

import React from "react";
import { Sparkles, Loader2, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { AssistantTab, AssistantMessage, ContextualSuggestion } from "@/shared/hooks/useUniversalAssistant";
import type { ActionProposal } from "../../services/AssistantActionDispatcher";
import { AssistantActionCard } from "./AssistantActionCard";

interface AssistantMessageListProps {
    activeTab: AssistantTab;
    messages: AssistantMessage[];
    contextSuggestions: ContextualSuggestion[];
    isProcessing: boolean;
    error: string | null;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onSelectSuggestion: (prompt: string) => void;
    onExecuteAction: (action: ActionProposal) => Promise<void>;
}

export function AssistantMessageList({
    activeTab,
    messages,
    contextSuggestions,
    isProcessing,
    error,
    messagesEndRef,
    onSelectSuggestion,
    onExecuteAction,
}: AssistantMessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 elegant-scrollbar">
            {activeTab === 'context' && (
                <div className="space-y-3">
                    <p className="text-xs text-text-muted font-medium">
                        Suggestions intelligentes basées sur votre page active :
                    </p>
                    {contextSuggestions.map((sug) => (
                        <button
                            key={sug.id}
                            onClick={() => onSelectSuggestion(sug.prompt)}
                            className="w-full text-left p-3 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-border hover:border-accent/40 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-accent group-hover:text-text-primary transition-colors">
                                    {sug.title}
                                </span>
                                <CornerDownLeft className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-text-secondary line-clamp-2">
                                {sug.prompt}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'chat' && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-text-primary">Comment puis-je vous assister ?</p>
                        <p className="text-[11px] text-text-muted mt-1 max-w-xs">
                            Posez une question métier, demandez une analyse ou déclenchez une action.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'chat' && messages.map((msg) => (
                <div
                    key={msg.id}
                    className={cn(
                        "flex flex-col",
                        msg.role === 'user' ? "items-end" : "items-start"
                    )}
                >
                    <div
                        className={cn(
                            "max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed",
                            msg.role === 'user'
                                ? "bg-accent text-bg-primary font-medium rounded-tr-none shadow-md shadow-accent/10"
                                : "bg-bg-secondary border border-border text-text-primary rounded-tl-none"
                        )}
                    >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Cartes d'Actions Proposées */}
                        {msg.suggestedActions && msg.suggestedActions.map((action) => (
                            <AssistantActionCard
                                key={action.id}
                                proposal={action}
                                onExecute={onExecuteAction}
                            />
                        ))}
                    </div>

                    <span className="text-[9px] text-text-muted px-1 mt-1 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ))}

            {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-text-muted p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>Génération de la réponse en cours...</span>
                </div>
            )}

            {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {error}
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}
