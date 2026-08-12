"use client";
import React, { useState } from 'react';
import { HelpCircle, X, Send, History, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useSupportTickets } from './useSupportTickets';
import { withVerticalOverride } from '@/design/hooks/useVerticalComponent';
import { useTenant } from '@/kernel/providers/NexusCoreProvider';

export interface SupportHelpWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  pageContext?: string;
}

function SupportHelpWidgetImpl({ position = 'bottom-right', pageContext }: SupportHelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { tickets, loading, submitTicket } = useSupportTickets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setFormError('La description doit contenir au moins 10 caractères.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const fullDesc = pageContext
        ? `${description}\n\nContexte Page: ${pageContext}`
        : description;

      await submitTicket(fullDesc, screenshotUrl.trim() || undefined);
      setSubmitSuccess(true);
      setDescription('');
      setScreenshotUrl('');
      setTimeout(() => {
        setSubmitSuccess(false);
        setTab('history');
      }, 2000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const posClasses = position === 'bottom-left' ? 'bottom-6 left-6' : 'bottom-6 right-6';

  return (
    <div className={`fixed z-50 ${posClasses} font-sans`}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#0F172A] text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 border border-slate-700 active:scale-95"
          aria-label="Aide et Support IA"
        >
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Aide & Support IA</span>
        </button>
      )}

      {isOpen && (
        <div className="w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[550px] animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <HelpCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Support & Assistant IA</h3>
                <p className="text-[10px] text-slate-400">Analyse & résolution automatique 24/7</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 gap-1">
            <button
              onClick={() => setTab('new')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tab === 'new'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Nouveau ticket
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Historique ({tickets.length})
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {tab === 'new' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitSuccess ? (
                  <div className="p-6 text-center space-y-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                    <h4 className="text-sm font-bold text-emerald-300">Ticket Soumis avec Succès !</h4>
                    <p className="text-xs text-slate-300">L&apos;IA analyse votre requête en arrière-plan...</p>
                  </div>
                ) : (
                  <>
                    {formError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Décrivez votre problème ou question
                      </label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Ex: Problème d'impression du Z de caisse ou anomalie sur le stock..."
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        URL de capture d&apos;écran (optionnel)
                      </label>
                      <input
                        type="url"
                        value={screenshotUrl}
                        onChange={e => setScreenshotUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-400 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyse en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Envoyer au Support IA
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <div className="space-y-3">
                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des tickets...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Aucun ticket soumis pour le moment.
                  </div>
                ) : (
                  tickets.map(t => (
                    <div key={t.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-300 line-clamp-1">{t.description}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          t.status === 'draft_ready' || t.status === 'approved' || t.status === 'applied'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : t.status === 'analyzing'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      {t.draft && (
                        <div className="p-2 bg-slate-900 rounded-lg text-[10px] text-slate-300 border border-slate-800">
                          <p className="font-bold text-amber-400 mb-0.5">{t.draft.title}</p>
                          <p className="text-slate-400 line-clamp-2">{t.draft.summary}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const SupportHelpWidget = withVerticalOverride('SupportHelpWidget', SupportHelpWidgetImpl);

export function SupportHelpWidgetGate() {
  const { activeTenantConfig } = useTenant();

  // Show if mod_support is not false and tier is not FREE
  const enabled = activeTenantConfig?.capabilities?.mod_support !== false && (activeTenantConfig?.tier as string) !== 'FREE';
  if (!enabled) return null;

  return <SupportHelpWidget />;
}
