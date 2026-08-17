"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useUniversalAssistant } from "@/shared/hooks/useUniversalAssistant";
import { AssistantTriggerButton } from "./assistant-frame/AssistantTriggerButton";
import { AssistantHeader } from "./assistant-frame/AssistantHeader";
import { AssistantMessageList } from "./assistant-frame/AssistantMessageList";

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
                <AssistantTriggerButton onClick={() => setViewMode('DOCK_RIGHT')} />
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
                            <AssistantHeader
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                clearSession={clearSession}
                            />

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
                            <AssistantMessageList
                                activeTab={activeTab}
                                messages={messages}
                                contextSuggestions={contextSuggestions}
                                isProcessing={isProcessing}
                                error={error}
                                messagesEndRef={messagesEndRef}
                                onSelectSuggestion={handleSelectSuggestion}
                                onExecuteAction={executeAction}
                            />

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
