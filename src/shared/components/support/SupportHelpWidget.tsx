"use client";
import React, { useState } from "react";
import { LifeBuoy, Send, X, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useSupportTickets } from "./useSupportTickets";

export function SupportHelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "history">("new");
  const [description, setDescription] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const { tickets, loading, submitTicket } = useSupportTickets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setFeedback({ ok: false, msg: "Veuillez décrire le problème avec au moins 10 caractères." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await submitTicket(description, screenshotUrl || undefined);
      setDescription("");
      setScreenshotUrl("");
      setFeedback({ ok: true, msg: "Ticket transmis au support plateforme MCC avec succès." });
      setTab("history");
    } catch (err: unknown) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Erreur de transmission" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="support-help-widget-button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-surface-card text-accent-gold border border-accent-gold/30 rounded-full shadow-2xl backdrop-blur-md hover:bg-surface-glass-hover hover:border-accent-gold/60 transition-all active:scale-95 group"
        title="Assistance & Support Plateforme"
      >
        <LifeBuoy className="w-5 h-5 animate-pulse text-accent-gold group-hover:rotate-45 transition-transform" />
        <span className="text-xs font-semibold tracking-wide text-text-primary">Assistance MCC</span>
      </button>

      {/* Support Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-surface-card border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-surface-card/50">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-accent-gold" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Support Dédié MCC</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-glass-hover transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-default text-xs font-medium">
              <button
                onClick={() => setTab("new")}
                className={"flex-1 py-3 text-center transition " + (tab === "new" ? "text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5 font-bold" : "text-text-muted hover:text-text-primary")}
              >
                Nouveau Ticket
              </button>
              <button
                onClick={() => setTab("history")}
                className={"flex-1 py-3 text-center transition " + (tab === "history" ? "text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5 font-bold" : "text-text-muted hover:text-text-primary")}
              >
                Historique ({tickets.length})
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {tab === "new" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {feedback && (
                    <div className={"p-3 rounded-lg text-xs flex items-center gap-2 " + (feedback.ok ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-300" : "bg-rose-950/60 border border-rose-500/30 text-rose-300")}>
                      {feedback.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{feedback.msg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Description de l incident ou de la demande
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Précisez le problème rencontré (ex: blocage au règlement CB, anomalie de stock, demande de configuration...)"
                      className="w-full px-3 py-2 text-xs bg-surface-bg border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-gold transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Lien capture d écran / Logs (Optionnel)
                    </label>
                    <input
                      type="url"
                      value={screenshotUrl}
                      onChange={(e) => setScreenshotUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs bg-surface-bg border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-gold transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || description.trim().length < 10}
                    className="w-full py-2.5 px-4 bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? "Transmission en cours..." : "Envoyer au Support MCC"}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-xs text-text-muted text-center py-6">Chargement des demandes...</p>
                  ) : tickets.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-6">Aucun ticket de support actif.</p>
                  ) : (
                    tickets.map((t) => (
                      <div key={t.id} className="p-3 bg-surface-glass border border-border-default rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-micro">
                          <span className="font-mono text-text-muted">#{t.id.slice(0, 8)}</span>
                          <span className={"px-2 py-0.5 rounded text-nano font-bold uppercase tracking-wider " + (t.status === "applied" || t.status === "approved" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" : t.status === "analyzing" ? "bg-amber-950 text-amber-400 border border-amber-500/30" : "bg-surface-glass text-text-secondary")}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-primary line-clamp-2">{t.description}</p>
                        <div className="text-nano text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(t.createdAt).toLocaleString("fr-FR")}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
