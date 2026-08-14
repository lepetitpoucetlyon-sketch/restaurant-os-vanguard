"use client";

import { useEffect } from "react";

export default function PosError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[POS/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-text-primary p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-sm uppercase tracking-widest text-text-muted">Caisse</div>
        <h1 className="text-xl font-semibold">Le POS est temporairement indisponible</h1>
        <p className="text-sm text-text-secondary">
          Vos tickets en cours sont conservés localement. Rechargez la caisse pour reprendre le service.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-lg bg-action-primary text-action-primary-fg font-medium hover:opacity-90"
          >
            Recharger la caisse
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-lg border border-border-default text-text-primary hover:bg-surface-card"
          >
            Retour accueil
          </a>
        </div>
      </div>
    </div>
  );
}
