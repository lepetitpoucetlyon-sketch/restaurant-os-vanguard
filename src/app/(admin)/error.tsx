'use client';

import React, { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[AdminError] Exception console MCC / Administration:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: { boundary: 'admin-error', digest: error.digest ?? 'unknown' },
    });
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 antialiased">
      <div className="max-w-xl w-full bg-[#13141a]/90 backdrop-blur-2xl border border-red-500/20 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto text-2xl font-bold">
          🛡️
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Incident Console MCC / Admin
          </h1>
          <p className="text-sm text-gray-400">
            Une erreur critique est survenue dans l&apos;interface d&apos;administration. Les politiques d&apos;isolation multi-tenant restent strictement actives.
          </p>
        </div>

        {error.message && (
          <div className="bg-black/50 border border-white/5 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-mono text-red-300 font-semibold break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-nano font-mono text-gray-500">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-semibold text-sm transition-all"
          >
            Réessayer la vue
          </button>
          <Link
            href="/admin"
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10"
          >
            Tableau de Bord Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
