'use client';

import React, { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { activeCartAtom } from '@/modules/ops';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';

export default function PosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const activeCart = useAtomValue(activeCartAtom);
  const itemCount = activeCart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) ?? 0;

  useEffect(() => {
    logger.error('[PosError] Interruption sur l\'interface Caisse POS:', {
      message: error.message,
      digest: error.digest,
      itemCount,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: { boundary: 'pos-error', digest: error.digest ?? 'unknown', preservedCartItems: itemCount },
    });
  }, [error, itemCount]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 antialiased">
      <div className="max-w-xl w-full bg-[#13141a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        
        {/* Badge Statut */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Panier & Session Préservés
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Incident d&apos;affichage de caisse
          </h1>
          <p className="text-sm text-gray-400">
            Une erreur visuelle est survenue, mais votre commande est restée en mémoire dans l&apos;état exact où vous l&apos;avez laissée.
          </p>
        </div>

        {/* Détail du panier sauvegardé */}
        {activeCart && activeCart.items && activeCart.items.length > 0 ? (
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Commande en cours ({itemCount} article{itemCount > 1 ? 's' : ''})</span>
              <span className="text-[#C5A059] font-mono">En mémoire</span>
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-white/5 pr-1 space-y-1">
              {activeCart.items.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between items-center py-1.5 text-sm">
                  <span className="text-gray-200 font-medium">
                    <span className="text-[#C5A059] font-mono mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {item.unitPriceInMicrounits ? `${((item.unitPriceInMicrounits * item.quantity) / 1_000_000).toFixed(2)} €` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-xs text-gray-400">
            Aucun panier actif n&apos;était en cours lors de l&apos;incident.
          </div>
        )}

        {error.digest && (
          <p className="text-micro font-mono text-gray-600">
            Code diagnostic : {error.digest}
          </p>
        )}

        {/* Boutons d'action */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-8 py-3 rounded-xl bg-[#C5A059] hover:bg-[#d4af37] text-black font-bold text-sm transition-all shadow-lg shadow-[#C5A059]/25 flex items-center justify-center gap-2"
          >
            <span>🔄</span> Reprendre la commande
          </button>
          <button
            onClick={() => { window.location.reload(); }}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10"
          >
            Recharger la caisse
          </button>
        </div>
      </div>
    </div>
  );
}
