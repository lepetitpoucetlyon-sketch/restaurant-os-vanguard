'use client';
import React, { useState } from 'react';
import { authedFetch } from '@/lib/client/authedFetch';

interface OnboardingHelpButtonProps {
  currentStep?: string;
  category?: string;
  errorContext?: string;
}

export function OnboardingHelpButton({ currentStep, category, errorContext }: OnboardingHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await authedFetch('/api/tenant/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[Onboarding] Aide demandée${category ? ` — ${category}` : ''}`,
          description: message,
          context: {
            step: currentStep,
            category,
            errorContext,
            source: 'onboarding_wizard',
          },
          priority: 'high',
        }),
      });
      if (!res.ok) throw new Error('Erreur envoi');
      setSent(true);
      setTimeout(() => { setOpen(false); setSent(false); setMessage(''); }, 3000);
    } catch {
      setError('Impossible d\'envoyer le ticket. Réessayez ou contactez support@restaurantos.app');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-300 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors"
      >
        <span>🆘</span>
        <span>Demander de l&apos;aide</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)} aria-hidden="true">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Demander de l'aide"
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Demander de l&apos;aide</h3>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {sent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-medium text-emerald-700">Message envoyé !</p>
                <p className="text-sm text-gray-500 mt-1">Notre équipe vous répond sous 2h en moyenne.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                  <strong>Décrivez votre blocage</strong> et notre équipe support vous aidera à importer vos données.
                  {currentStep && <span className="block mt-1 text-blue-500">Étape : {currentStep}{category ? ` · ${category}` : ''}</span>}
                </div>

                <textarea
                  rows={4}
                  placeholder="Ex : Je n'arrive pas à exporter mes données depuis Zelty. Le fichier CSV que j'ai n'est pas reconnu..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60"
                  >
                    {sending ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400">
                  Ou écrivez directement à{' '}
                  <a href="mailto:support@restaurantos.app" className="underline">support@restaurantos.app</a>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
