'use client';

import React, { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';
import { RefreshCw, Utensils } from 'lucide-react';

export default function OrderingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[OrderingError] Exception dans le portail de commande:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: { boundary: 'ordering-client-error', digest: error.digest ?? 'unknown' },
    });
  }, [error]);

  return (
    <div className="min-min-h-[100dvh] flex items-center justify-center p-6 bg-bg-primary antialiased">
      <div className="max-w-md w-full bg-surface-card border border-border rounded-2xl p-6 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-action-primary/10 border border-action-primary/20 text-action-primary flex items-center justify-center mx-auto">
          <Utensils className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            Votre commande est en cours de reprise
          </h2>
          <p className="text-xs text-text-secondary">
            Un léger contretemps est survenu. Votre sélection reste enregistrée localement.
          </p>
        </div>

        {error.message && (
          <div className="bg-bg-tertiary border border-border/50 rounded-xl p-2.5 text-left">
            <p className="text-[11px] font-mono text-text-muted truncate">
              {error.message}
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-xl bg-action-primary hover:opacity-90 text-text-on-primary font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reprendre la commande</span>
          </button>
        </div>
      </div>
    </div>
  );
}
