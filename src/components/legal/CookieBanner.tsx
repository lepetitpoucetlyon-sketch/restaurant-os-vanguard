'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'cookie-consent';

type ConsentValue = 'accepted' | 'rejected';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    } else if (stored === 'rejected') {
      // TODO: Bloquer GTM/GA — ne pas charger les scripts d'analytics optionnels.
      // Exemple : ne pas initialiser window.dataLayer ni le pixel publicitaire.
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted' satisfies ConsentValue);
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected' satisfies ConsentValue);
    // TODO: Bloquer GTM/GA — ne pas charger les scripts d'analytics optionnels.
    // Exemple : ne pas initialiser window.dataLayer ni le pixel publicitaire.
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 leading-relaxed">
            Nous utilisons uniquement des cookies essentiels au fonctionnement du service.
            Aucun cookie publicitaire ni de suivi n'est activé sans votre accord explicite.{' '}
            <a
              href="/legal/rgpd"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              En savoir plus
            </a>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-lg
                       hover:text-white hover:border-gray-400 transition-colors focus:outline-none
                       focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Refuser les optionnels
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-semibold bg-white text-gray-900 rounded-lg
                       hover:bg-gray-100 transition-colors focus:outline-none
                       focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            J'accepte
          </button>
        </div>
      </div>
    </div>
  );
}
