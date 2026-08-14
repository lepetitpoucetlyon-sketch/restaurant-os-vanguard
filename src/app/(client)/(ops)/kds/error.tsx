"use client";

import { useEffect } from "react";

export default function KdsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[KDS/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-text-primary p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-sm uppercase tracking-widest text-text-muted">Écran cuisine</div>
        <h1 className="text-xl font-semibold">L&apos;écran cuisine s&apos;est interrompu</h1>
        <p className="text-sm text-text-secondary">
          Les commandes en cours sont sauvegardées côté serveur. Rechargez pour retrouver la file.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-lg bg-action-primary text-action-primary-fg font-medium hover:opacity-90"
        >
          Recharger le KDS
        </button>
      </div>
    </div>
  );
}
