"use client";

// @wip owner:intelligence-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  Loader2,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useOracleAgent } from "@/shared/hooks/useGeminiAgent";

export function OracleChatDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isProcessing, error, sendMessage, startNewSession } =
    useOracleAgent();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Assistant d'Analyse Métier"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-bg-primary border-l border-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-bg-secondary">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">
                    Assistant d'Analyse
                  </h3>
                  <p className="text-nano text-text-muted uppercase tracking-widest">
                    Aide au pilotage opérationnel
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={startNewSession}
                  aria-label="Nouvelle conversation"
                  className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted"
                  title="Nouvelle conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button aria-label="Fermer"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 elegant-scrollbar">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
                  <MessageSquare className="w-12 h-12 opacity-20" />
                  <div className="text-center">
                    <p className="text-xs font-bold">
                      Posez une question sur vos opérations
                    </p>
                    <p className="text-nano mt-1 max-w-[240px]">
                      Menu, stocks, finances, planning, conformité... Accédez rapidement aux indicateurs clés.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {[
                      "Quel est mon food cost ce mois ?",
                      "Stock bas à surveiller ?",
                      "Prochaine échéance HACCP ?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="px-3 py-1.5 rounded-full text-nano font-bold border border-border hover:border-accent hover:text-accent transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-accent text-white rounded-br-md"
                        : "bg-bg-secondary border border-border rounded-bl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={cn(
                        "text-nano mt-1.5 font-mono",
                        msg.role === "user"
                          ? "text-white/50"
                          : "text-text-muted"
                      )}
                    >
                      {msg.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-bg-secondary border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span className="text-nano text-text-muted">
                      Analyse des données en cours...
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3 text-xs text-status-error">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-bg-secondary">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez une question sur votre restaurant..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-bg-tertiary rounded-xl text-xs text-text-primary placeholder:text-text-muted border border-transparent focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  aria-label="Envoyer le message"
                  disabled={!input.trim() || isProcessing}
                  className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
