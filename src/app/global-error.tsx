'use client';

import React, { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';
import { Button } from "@/shared/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[GlobalError] Exception fatale non capturée:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: { boundary: 'global-error', digest: error.digest ?? 'unknown' },
    });
  }, [error]);

  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 font-sans antialiased">
        <div className="max-w-md w-full bg-[#13141a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Interruption Critique du Système
            </h1>
            <p className="text-sm text-gray-400">
              Une exception inattendue a bloqué le rendu global. L&apos;état système et les journaux de sécurité ont été préservés.
            </p>
          </div>

          {error.digest && (
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-gray-500">
              Code incident : {error.digest}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="ghost"
              onClick={() => reset()}
              className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4af37] text-black font-semibold text-sm transition-all shadow-lg shadow-[#C5A059]/20"
            >
              Relancer l&apos;application
            </Button>
            <Button variant="ghost"
              onClick={() => { window.location.href = '/'; }}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10"
            >
              Retour à l&apos;accueil
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
