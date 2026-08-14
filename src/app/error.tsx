"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-text-primary p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl font-serif text-brand">!</div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Une erreur inattendue est survenue</h1>
          <p className="text-sm text-text-secondary">
            L&apos;équipe a été notifiée. Vous pouvez recharger la page pour reprendre.
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-lg bg-action-primary text-action-primary-fg font-medium hover:opacity-90 transition-opacity"
        >
          Recharger
        </button>
      </div>
    </div>
  );
}
