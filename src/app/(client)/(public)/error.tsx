'use client';

import React, { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function PublicClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[PublicClientError] Exception portail public:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: { boundary: 'public-client-error', digest: error.digest ?? 'unknown' },
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 antialiased">
      <div className="max-w-md w-full bg-surface-card border border-border rounded-2xl p-6 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-status-warning/10 border border-status-warning/20 text-status-warning flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            Page momentanément indisponible
          </h2>
          <p className="text-xs text-text-secondary">
            Une erreur de chargement est survenue. Veuillez réessayer.
          </p>
        </div>

        {error.message && (
          <div className="bg-bg-tertiary border border-border/50 rounded-xl p-2.5 text-left">
            <p className="text-[11px] font-mono text-text-muted truncate">
              {error.message}
            </p>
          </div>
        )}

        <div className="pt-2 flex gap-2.5">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 rounded-xl bg-action-primary hover:opacity-90 text-text-on-primary font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-surface-glass hover:bg-bg-tertiary text-text-primary font-medium text-xs transition-all border border-border flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
