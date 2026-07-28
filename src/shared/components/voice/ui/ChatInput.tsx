"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface ChatInputProps {
    textInput: string;
    setTextInput: (val: string) => void;
    isDictating: boolean;
    isProcessing: boolean;
    pendingAction: boolean;
    onSend: (e: React.FormEvent) => void;
    onToggleDictation: () => void;
}

export function ChatInput({ 
    textInput, 
    setTextInput, 
    isDictating, 
    isProcessing, 
    pendingAction, 
    onSend, 
    onToggleDictation 
}: ChatInputProps) {
    return (
        <div className="px-6 py-4 border-t border-border/50 bg-bg-secondary shrink-0">
            <form onSubmit={onSend} className="flex gap-3 items-center relative">
                <input
                    type="text"
                    value={isDictating ? "" : textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={isDictating ? "En écoute..." : "Écrire à l'Oracle..."}
                    disabled={pendingAction || isProcessing || isDictating}
                    className={cn(
                        "flex-1 bg-bg-primary border border-border/50 text-text-primary h-12 rounded-2xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold disabled:opacity-50 transition-all",
                        isDictating && "border-accent animate-pulse"
                    )}
                />
                
                <button
                    type="button"
                    onClick={onToggleDictation}
                    disabled={pendingAction || isProcessing}
                    className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                        isDictating 
                            ? "bg-accent text-text-primary animate-pulse shadow-lg shadow-accent/20" 
                            : "bg-bg-tertiary text-text-primary hover:bg-surface-sidebar hover:text-text-primary disabled:opacity-50"
                    )}
                >
                    <Mic className="w-5 h-5" />
                </button>

                <AnimatePresence>
                    {!isDictating && textInput.trim() && !pendingAction && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 48 }}
                            exit={{ opacity: 0, scale: 0.5, width: 0 }}
                            type="submit"
                            disabled={isProcessing}
                            className="h-12 w-12 rounded-2xl bg-text-primary text-text-primary flex items-center justify-center shrink-0 hover:bg-accent-gold transition-colors disabled:opacity-50"
                        >
                            <Send className="w-5 h-5 ml-1" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
}
