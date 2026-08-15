"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Send,
    X,
    Loader2,
    MessageSquare,
    Trash2,
    Maximize2,
    Minimize2,
    Shield,
    Zap,
    History,
    CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useUniversalAssistant, AssistantViewMode, AssistantTab } from "@/shared/hooks/useUniversalAssistant";
import { ActionProposalCard } from "./ActionProposalCard";

export function UniversalAssistantFrame() {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        messages,
        isProcessing,
        error,
        sendMessage,
        executeAction,
        clearSession,
        contextSuggestions,
    } = useUniversalAssistant();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (viewMode !== 'COLLAPSED') {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [viewMode]);

    const handleSend = () => {
        if (!input.trim() || isProcessing) return;
        sendMessage(input.trim());
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSelectSuggestion = (prompt: string) => {
        setActiveTab('chat');
        sendMessage(prompt);
    };

    return (
        <>
            {/* ── 1. Bouton Flottant (Trigger FAB en mode COLLAPSED) ────────── */}
            {viewMode === 'COLLAPSED' && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('DOCK_RIGHT')}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-bg-secondary/90 border border-accent/40 shadow-2xl backdrop-blur-md text-text-primary hover:border-accent hover:shadow-accent/20 transition-all group"
                    title="Ouvrir le Copilote IA (Cmd+K)"
                >
                    <div className="relative w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-bg-primary transition-colors">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent ring-2 ring-bg-primary" />
                    </div>

                    <div className="text-left hidden sm:block">
                        <span className="text-xs font-bold block leading-none text-text-primary">Copilote IA</span>
                        <span className="text-[10px] text-text-muted font-mono">⌘K</span>
                    </div>
                </motion.button>
            )}

            {/* ── 2. Frame Flottant / Dockable ───────────────────────────────── */}
            <AnimatePresence>
                {viewMode !== 'COLLAPSED' && (
                    <>
                        {/* Backdrop discret si mode EXPANDED */}
                        {viewMode === 'EXPANDED' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setViewMode('COLLAPSED')}
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            />
                        )}

                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 28, stiffness: 280 }}
                            className={cn(
                                "fixed z-50 bg-bg-primary/95 border border-border/80 shadow-2xl backdrop-blur-xl flex flex-col transition-all duration-300",
                                viewMode === 'EXPANDED'
                                    ? "inset-4 sm:inset-10 rounded-2xl border-accent/30"
                                    : "top-0 right-0 bottom-0 w-full sm:w-[420px] border-l"
                            )}
                        >
                            {/* Header de la Frame */}
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
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-accent/20 text-accent uppercase">
                                                Universal
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-text-muted flex items-center gap-1">
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

                            {/* Onglets de navigation interne */}
                            <div className="flex items-center border-b border-border bg-bg-tertiary/40 px-3 py-1 text-xs">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors",
                                        activeTab === 'chat'
                                            ? "bg-bg-secondary text-accent shadow-sm"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Chat</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('context')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors",
                                        activeTab === 'context'
                                            ? "bg-bg-secondary text-accent shadow-sm"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>Raccourcis ({contextSuggestions.length})</span>
                                </button>
                            </div>

                            {/* Contenu principal */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 elegant-scrollbar">
                                {activeTab === 'context' && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-text-muted font-medium">
                                            Suggestions intelligentes basées sur votre page active :
                                        </p>
                                        {contextSuggestions.map((sug) => (
                                            <button
                                                key={sug.id}
                                                onClick={() => handleSelectSuggestion(sug.prompt)}
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
                                                <ActionProposalCard
                                                    key={action.id}
                                                    proposal={action}
                                                    onExecute={executeAction}
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

                            {/* Barre de saisie */}
                            <div className="p-3 border-t border-border bg-bg-secondary/80">
                                <div className="relative flex items-center">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Poser une question ou demander une action..."
                                        disabled={isProcessing}
                                        className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-bg-tertiary border border-border focus:border-accent focus:outline-none text-xs text-text-primary placeholder:text-text-muted transition-colors disabled:opacity-50"
                                    />

                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isProcessing}
                                        className="absolute right-1.5 p-2 rounded-lg bg-accent text-bg-primary hover:bg-accent/90 disabled:opacity-30 transition-all"
                                        title="Envoyer"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
