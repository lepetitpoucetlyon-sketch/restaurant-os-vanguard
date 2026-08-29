'use client';

import React, { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[GlobalError] Exception non interceptée au niveau racine:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: { boundary: 'global-root-error', digest: error.digest ?? 'unknown' },
    });
  }, [error]);

  return (
    <div className="min-min-h-[100dvh] flex items-center justify-center p-6 bg-bg-primary antialiased">
      <div className="max-w-lg w-full bg-surface-card border border-border rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-status-warning/10 border border-status-warning/20 text-status-warning flex items-center justify-center mx-auto text-2xl font-bold">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            Une interruption inattendue est survenue
          </h2>
          <p className="text-sm text-text-secondary">
            Le système a sécurisé l&apos;état en cours. Vous pouvez tenter de recharger cette section ou revenir à l&apos;accueil.
          </p>
        </div>

        {error.message && (
          <div className="bg-bg-tertiary border border-border rounded-xl p-3 text-left">
            <p className="text-xs font-mono text-text-muted truncate">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-text-muted/60 mt-1">
                Réf: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-xl bg-action-primary hover:opacity-90 text-text-on-primary font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-surface-glass hover:bg-bg-tertiary text-text-primary font-medium text-sm transition-all border border-border flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
