'use client';

import React, { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';
import Link from 'next/link';

export default function OpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[OpsError] Exception dans le module opérationnel:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: { boundary: 'ops-error', digest: error.digest ?? 'unknown' },
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 antialiased">
      <div className="max-w-lg w-full bg-[#13141a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
          ⚡
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Incident sur le module opérationnel
          </h2>
          <p className="text-sm text-gray-400">
            Une erreur d&apos;affichage est survenue. Vos données en cours et vos connexions matérielles restent synchronisées.
          </p>
        </div>

        {error.message && (
          <div className="bg-black/50 border border-white/5 rounded-xl p-3 text-left">
            <p className="text-xs font-mono text-gray-400 truncate">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-gray-600 mt-1">
                Réf: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4af37] text-black font-semibold text-sm transition-all shadow-lg shadow-[#C5A059]/20"
          >
            Réessayer
          </button>
          <Link
            href="/pos"
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10"
          >
            Retour Caisse
          </Link>
        </div>
      </div>
    </div>
  );
}
