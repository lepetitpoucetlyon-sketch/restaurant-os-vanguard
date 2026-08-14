"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[Admin/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-text-primary p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-sm uppercase tracking-widest text-text-muted">Console MCC</div>
        <h1 className="text-xl font-semibold">La console d&apos;administration a rencontré une erreur</h1>
        <p className="text-sm text-text-secondary">
          Aucune donnée tenant n&apos;a été affectée. Le SovereignGuard reste actif.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-lg bg-action-primary text-action-primary-fg font-medium hover:opacity-90"
        >
          Recharger la console
        </button>
      </div>
    </div>
  );
}
